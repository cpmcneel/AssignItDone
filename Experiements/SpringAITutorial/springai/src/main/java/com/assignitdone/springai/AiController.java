package com.assignitdone.springai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.http.MediaType;
import reactor.core.publisher.Flux;

@RestController 
public class AiController {
    
    ChatClient chatClient;

    public AiController(ChatClient.Builder chatClientBuilder){
        this.chatClient = chatClientBuilder
            .build();
    }

    @GetMapping(value = "/askAI/{que}")
    public Flux<String> askAi(@PathVariable("que") String que){

        return chatClient
            .prompt()
            .system("Only answer questions with short responses about hollywood movies")
            .user(que)
            .stream()
            .content();
    }
}
