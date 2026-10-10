package edu.assignitdone;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class ChatServiceTest {
    @Test void mockDoesNotNeedKeyOrHttpClient() {
        var reply = new ChatService(true, "", "unused", null).chat("HCI due October 21");
        assertEquals("mock", reply.mode());
        assertTrue(reply.response().contains("HCI due October 21"));
    }
    @Test void invalidInputAndMissingKeyAreRejectedBeforeNetwork() {
        var service = new ChatService(false, "", "test", null);
        for (String text : new String[] { null, " ", "x".repeat(4001) }) {
            assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(ResponseStatusException.class, () -> service.chat(text)).getStatusCode());
        }
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
            assertThrows(ResponseStatusException.class, () -> service.chat("hello")).getStatusCode());
    }
    @Test void cloudPayloadAndResponseAreMappedWithoutRealCloudCall() {
        var builder = RestClient.builder().baseUrl("https://ollama.com");
        var server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("https://ollama.com/api/chat"))
            .andExpect(header("Authorization", "Bearer test-key"))
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(content().string(org.hamcrest.Matchers.containsString("\"stream\":false")))
            .andExpect(content().string(org.hamcrest.Matchers.containsString("\"num_predict\":512")))
            .andExpect(content().string(org.hamcrest.Matchers.containsString("HCI due October 21")))
            .andRespond(withSuccess("{\"message\":{\"content\":\"Course: HCI\"}}", MediaType.APPLICATION_JSON));
        var reply = new ChatService(false, "test-key", "gemma4:31b", builder.build()).chat("HCI due October 21");
        assertEquals("Course: HCI", reply.response());
        assertEquals("cloud", reply.mode());
        server.verify();
    }
    @Test void quotaErrorIsSafeAndNotRetried() {
        var builder = RestClient.builder().baseUrl("https://ollama.com");
        var server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("https://ollama.com/api/chat"))
            .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).body("secret-provider-detail"));
        var exception = assertThrows(ResponseStatusException.class,
            () -> new ChatService(false, "test-key", "test", builder.build()).chat("hello"));
        assertTrue(exception.getReason().contains("usage limit"));
        assertFalse(exception.getReason().contains("secret-provider-detail"));
        server.verify();
    }
    @Test void malformedProviderResponseIsRejected() {
        var builder = RestClient.builder().baseUrl("https://ollama.com");
        var server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("https://ollama.com/api/chat"))
            .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        assertEquals(HttpStatus.BAD_GATEWAY, assertThrows(ResponseStatusException.class,
            () -> new ChatService(false, "test-key", "test", builder.build()).chat("hello")).getStatusCode());
        server.verify();
    }
}
