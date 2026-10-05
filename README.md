# AssignItDone

AssignItDone is a student assignment tracker and study assistant prototype. The dashboard helps students find a task that fits the time they have, manage due dates, and add or complete work by voice or touch.

## Getting started

The hosted demo is available at [assignitdone-team-demo.demon765.chatgpt.site](https://assignitdone-team-demo.demon765.chatgpt.site/). It opens with generic sample assignments so you can try the main flows immediately.

1. Set the number of minutes you have and select **Find my next task**.
2. Select **Start work timer** to begin a work session.
3. Use the pencil button to edit an assignment or the checkmark to mark it complete.
4. Select the plus button to add an assignment manually.
5. Select **Import Canvas calendar** to import a Canvas calendar export (`.ics`). Imported events are added to the assignment list; importing the same event again does not create a duplicate.

## Voice input

Select the microphone button and allow microphone access when prompted. Voice recognition depends on browser and device support; Chrome and Edge on desktop and Android generally provide the most consistent support. If access was denied earlier, change the microphone permission in the browser settings for the site.

Voice commands can ask what is due, complete an assignment, or create a draft. For example: “What is due this week?”, “Complete project proposal”, or “Add my HCI proposal and make it due Sunday.” The draft opens for review; confirm or edit the course, due date, estimate, and other details before saving.

## Phone access

Open the hosted demo on the phone. It does not need to be on the same Wi-Fi network as the development computer.

- iPhone or iPad: open the site in Safari, select **Share**, then **Add to Home Screen**.
- Android: open the site in Chrome, open the browser menu, then select **Add to Home screen**.

## Study library

1. Select **Study library**, then create a folder for a class.
2. Upload searchable PDF, Markdown, or plain-text notes to that class folder.
3. AssignItDone creates a flashcard deck from definition-style notes, Markdown sections, and longer fact statements. Open the deck to flip through cards or start voice practice.
4. In practice, answer by speaking or typing. You can also choose **I don’t know yet** to see the note-based explanation and key ideas to revisit.

Notes are parsed in the browser and the generated cards are saved in that browser’s local storage. This prototype does not send notes to an AI service. Answer feedback compares important words in a response with the source card, so it is a study aid rather than a semantic or instructor-grade assessment. Scanned PDFs and handwriting need OCR before their contents can be used.

## Privacy and saved information

The hosted demo starts with generic courses and assignments, not anyone’s personal classes, calendar, or account information. Assignment changes are saved in local storage in the current browser on the current device. They are not shared with teammates, synchronized across devices, or sent back to Canvas. Clearing browser or website data may erase them.

A Canvas import is a snapshot of the calendar when imported. Completing or editing an assignment here does not change the original Canvas course. There is no direct Canvas account connection or backend in this prototype.

## Run and test locally

```sh
npm install
npm run dev
```

Vite prints the local development URL when the server starts. Run the parser and voice-command unit tests with `npm test`, and create a production build with `npm run build`.
