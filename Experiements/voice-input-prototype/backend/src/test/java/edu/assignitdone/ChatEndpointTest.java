package edu.assignitdone;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "experiment.mock=true")
class ChatEndpointTest {
    @LocalServerPort int port;

    private HttpResponse<String> post(String body) throws Exception {
        return HttpClient.newHttpClient().send(HttpRequest.newBuilder()
            .uri(URI.create("http://127.0.0.1:" + port + "/api/chat"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
    }
    @Test void mockEndpointReturnsJson() throws Exception {
        var response = post("{\"text\":\"HCI due October 21\"}");
        assertEquals(200, response.statusCode());
        assertTrue(response.body().contains("\"mode\":\"mock\""));
        assertTrue(response.body().contains("HCI due October 21"));
    }
    @Test void invalidAndMalformedRequestsReturnUsefulErrors() throws Exception {
        for (String body : new String[] { "{}", "{\"text\":\" \"}", "not-json" }) {
            var response = post(body);
            assertEquals(400, response.statusCode());
            assertTrue(response.body().contains("\"error\""));
        }
    }
}
