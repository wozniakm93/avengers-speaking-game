export class SpeechManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;

        if ('webkitSpeechRecognition' in window) {
            // eslint-disable-next-line no-undef
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = 'pl-PL';
            this.recognition.interimResults = true; // Enable Interim
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event) => this.handleResult(event);
            this.recognition.onerror = (event) => this.handleError(event);
            this.recognition.onend = () => this.handleEnd();
        } else {
            console.error("Speech Recognition Not Supported");
        }

        this.targetWord = "";
        this.onMatch = null;
        this.onNoMatch = null;
        this.onInterim = null;
    }

    startListening(word, onMatch, onNoMatch, onEnd, onInterim) {
        if (!this.recognition) {
            console.warn("No recognition available");
            return;
        }

        this.targetWord = word.toLowerCase();
        this.onMatch = onMatch;
        this.onNoMatch = onNoMatch;
        this.onInterim = onInterim;
        this.activeOnEnd = onEnd;

        try {
            this.recognition.start();
            this.isListening = true;
            console.log(`Listening for: ${this.targetWord}`);
        } catch (e) {
            console.warn("Already started", e);
        }
    }

    stop() {
        if (this.recognition) this.recognition.stop();
        this.isListening = false;
    }

    handleResult(event) {
        // Handle interim
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (this.onInterim && interimTranscript) {
            this.onInterim(interimTranscript);
        }

        if (finalTranscript) {
            const transcript = finalTranscript.toLowerCase().trim();
            console.log(`Heard Final: ${transcript}`);

            if (this.onMatch && transcript.includes(this.targetWord)) {
                this.onMatch();
            } else if (this.onNoMatch) {
                this.onNoMatch(transcript);
            }
        }
    }

    handleError(event) {
        console.error("Speech Error", event.error);
        this.isListening = false;
        if (this.activeOnEnd) this.activeOnEnd();
    }

    handleEnd() {
        this.isListening = false;
        if (this.activeOnEnd) this.activeOnEnd();
    }
}
