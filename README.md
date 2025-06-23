# Project Musebot

This is a functional prototype of a generative music tool that uses a Large Language Model (Google's Gemini 2.5 Flash) to compose and extend MIDI tracks.

## Project Goal

This project was inspired by OpenAI's MuseNet. My goal was not to retrain a massive model from scratch, but to discover whether similar creative results could be achieved by cleverly engineering prompts and data pipelines for a long-context and powerful, general-purpose LLM.

## My Core Contributions

While I leveraged modern tools to accelerate development, my primary engineering contributions were:

*   **The Data Pipeline:** Building the core TypeScript scripts that parse, convert, and structure MIDI data into a clean, text-based format suitable for the LLM.
*   **Prompt Engineering:** Developing and refining the prompts sent to the Gemini API to guide it toward producing stylistically coherent musical output.
*   **Backend & API Integration:** Integrating the front-end application with the Gemini API and managing the data flow.

---

## Technical Design Challenges & Solutions

Building Project Musebot involved navigating several key challenges inherent in translating complex musical structures into an LLM-compatible format and guiding AI creative output.

### 1. Bridging MIDI Complexity to LLM Simplicity: The Data Pipeline

*   **Challenge:** Raw MIDI files contain highly granular data (notes, velocity, timing, instrument types for 128+ different instruments) that is too complex and inconsistent for an LLM to reliably process and generate coherent musical patterns from.
*   **Solution:** I developed a custom data pipeline in **TypeScript** to preprocess MIDI data into a simplified, text-based format. This involved:
    *   **Extensive Data Collection:** Scouring the internet for diverse MIDI tracks across various genres, which were then parsed and stored in three distinct text files for different musical styles.
    *   **Intelligent Instrument Consolidation:** A critical step was reducing the ~128 distinct MIDI instrument types (e.g., bass guitars, pianos) into **13 consolidated, high-level instrument categories** (e.g., "Percussion," "Piano," "Violin" "Guitar"). This abstraction allowed the LLM to identify larger, more meaningful musical patterns and instrument interactions, rather than getting lost in micro-details.
    *   **Structured Text Representation:** Each MIDI event was converted into a standardized text token (e.g., ` Note: F#2 (Closed Hi-Hat), Time: 0.10s, Duration: 0.10s, Velocity: 0.60`), making the musical context explicit and readable for the LLM.

### 2. Guiding Generative AI Behavior: Advanced Prompt Engineering

*   **Challenge:** Initial attempts at AI generation often resulted in outputs that were either too generic, ignored the style prompt, or completely deviated from an original melody when extending a track. The AI needed sophisticated guidance to achieve targeted, creative results.
*   **Solution:** I iteratively refined the prompts through extensive experimentation, focusing on several key techniques:
    *   **Specific Contextual Wording:** Providing very precise instructions on desired style, tempo, and mood.
    *   **Negative Prompts:** Explicitly telling the AI what *not* to do (e.g., "avoid overly repetitive patterns," "do not ignore the provided melody").
    *   **Motif Encouragement:** Prompting the AI to introduce specific musical motifs, such as:
        *   **Instrument Solos:** Encouraging the AI to feature a particular instrument for a melodic solo within a section.
        *   **Decomposition & Recomposition:** Describing a process where individual instrument tracks are temporarily "removed" and then "reintroduced" with new variations to create dynamic arrangements.
    *   **Emphasis on Originality Preservation:** For track extension, prompts specifically encouraged the AI to "build upon" the original melody, adding variations and new sections rather than completely rewriting the provided input.

### 3. Real-time Feedback & Iteration

*   **Challenge:** Developing a creative AI tool requires rapid feedback loops. The interface needed to quickly display results and allow for user iteration.
*   **Solution:** The **React** frontend with the MIDI visualizer provides immediate visual and auditory feedback on the AI's generation. This rapid prototyping loop was essential for quickly testing prompt variations and data pipeline adjustments.

---

## Running This Project

**Important Note on API Usage:**
This project relies on the Gemini API. To run it locally, you will need to generate your own API key and place it within `.env.local`. Please be aware that the local version makes direct, context-heavy calls to the API for each generation, which can result in usage costs depending on your plan.

For free-tier usage, the application is designed to work optimally when deployed on cloud services like Google AI Studio, which has a different usage model.

## A Note on the UI
To achieve a polished result within a 24-hour rapid prototyping challenge, I strategically leveraged AI-powered tools for scaffolding some of the UI components, which I then customized, refined, and integrated into the **React/Vite** application.

---


## **Prerequisites:**
  (Requires Node.js)
  
```bash

  1. Install dependencies: `npm install`
  2. Create a .env.local file in the frontend /src directory with your Gemini API key:

      #  GEMINI_API_KEY=YOUR_API_KEY_HERE

  3. Run the app: `npm run dev`


