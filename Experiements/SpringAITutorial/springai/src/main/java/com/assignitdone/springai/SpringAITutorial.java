package com.assignitdone.springai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SpringAITutorial // implements CommandLineRunner 
{

    // ChatClient chatClient;

    // public SpringAITutorial(ChatClient.Builder chatClientBuilder){
    //     this.chatClient = chatClientBuilder
    //         .build();
    // }
    public static void main(String[] args) {
        SpringApplication.run(SpringAITutorial.class, args);
    }

    // @Override 
    // public void run(String... args) throws Exception{
    //     String promptText = "what is the latest springboot version";

    //     ChatClient.ChatClientRequestSpec requestSpec = chatClient.prompt(promptText);
    //     ChatClient.CallResponseSpec responseSpec = requestSpec.call();
    //     System.out.println(responseSpec.content());
    // }
}
