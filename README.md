# AssignItDone

Due to a lack of AI integration at this stage, run the following commands to start the backend bypassing the spring ai.

`cd backend`

`./mvnw spring-boot:run -Dmaven.test.skip=true -Dspring-boot.run.arguments="--spring.ai.model.chat=none --spring.ai.model.embedding=none --spring.ai.model.image=none --spring.ai.model.audio.speech=none --spring.ai.model.audio.transcription=none --spring.ai.model.moderation=none"`
