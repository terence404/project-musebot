# Project Musebot

This is a functional prototype of a generative music tool that uses a Large Language Model (Google's Gemini 2.5 Flash) to compose and extend MIDI tracks.

### Project Goal

This project was inspired by OpenAI's MuseNet. My goal was not to retrain a massive model from scratch, but to discover whether similar creative results could be achieved by cleverly engineering prompts and data pipelines for a long-context and powerful, general-purpose LLM.

### My Core Contributions

While I leveraged modern tools to accelerate development, my primary engineering contributions were:
*   **The Data Pipeline:**  Building the core TypeScript scripts that parse, convert, and structure MIDI data into a clean, text-based format suitable for the LLM.
*   **Prompt Engineering:** Developing and refining the prompts sent to the Gemini API to guide it toward producing stylistically coherent musical output.
*   **Backend & API Integration:** Integrating the front-end application with the Gemini API and managing the data flow.

### Running This Project

**Important Note on API Usage:**
This project relies on the Gemini API. To run it locally, you will need to generate your own API key and place it within .env.local. Please be aware that the local version makes direct, context-heavy calls to the API for each generation, which can result in usage costs depending on your plan.

For free-tier usage, the application is designed to work optimally when deployed on cloud services like Google AI Studio, which has a different usage model.


### A Note on the UI
To achieve a polished result within a 24-hour rapid prototyping challenge, I strategically leveraged AI-powered tools for scaffolding some of the UI components, which I then customized, refined, and integrated into the Svelte/Tauri application.


## **Prerequisites:**
  Node.js 
  
  1. Install dependencies: `npm install` 
  2. Set the `GEMINI_API_KEY` in `[.env.local]` to your Gemini API key 
  3. Run the app: `npm run dev`


