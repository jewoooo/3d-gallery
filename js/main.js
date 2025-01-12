import { IntroModal } from "./IntroModal";
import { Gallery } from "./Gallery";

class App {
	constructor() {
		this.introModal = new IntroModal(document.getElementById("intro-modal-container"));
		this.gallery = new Gallery(document.querySelector(".canvas-container"));
		this.initEventListeners();
	}
	
	initEventListeners() {
		document.getElementById("intro-modal-container").addEventListener("close", () => {
			this.introModal.hide();
			this.gallery.animate();
		});
	}
}

new App();