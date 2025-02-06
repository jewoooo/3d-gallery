import { IntroModal } from "./IntroModal";
import { Gallery } from "./Gallery";

class App {
	constructor() {
		this.introModal = new IntroModal(document.getElementById("intro-modal-container"));
		this.gallery = new Gallery(document.querySelector(".canvas-container"));

		// this.introModal.hide();
		this.checkGalleryRender();
		// this.initEventListeners();
	}
	
	checkGalleryRender() {
		setTimeout(() => {
			if (this.gallery.isRendered) {
				this.introModal.hide();
			}
		}, 4000);
	}
	// initEventListeners() {
	// 	document.getElementById("intro-modal-container").addEventListener("close", () => {
	// 		this.introModal.hide();
	// 		this.gallery.animate();
	// 	});
	// }
}

new App();