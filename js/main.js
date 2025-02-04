import { IntroModal } from "./IntroModal";
import { Gallery } from "./Gallery";

class App {
	constructor() {
		this.introModal = new IntroModal(document.getElementById("intro-modal-container"));
		this.gallery = new Gallery(document.querySelector(".canvas-container"));
		this.checkGalleryRender();
		// this.initEventListeners();
	}
	
	checkGalleryRender() {
		if (this.gallery.isRendered) {
			this.introModal.hide();
		} else {
			setTimeout(() => 
				this.checkGalleryRender(), 100);
		}
	}
	// initEventListeners() {
	// 	document.getElementById("intro-modal-container").addEventListener("close", () => {
	// 		this.introModal.hide();
	// 		this.gallery.animate();
	// 	});
	// }
}

new App();