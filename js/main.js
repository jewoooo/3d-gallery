import { IntroModal } from "./IntroModal";
import { Gallery } from "./Gallery";

class App {
	constructor() {
		this.introModal = new IntroModal(document.getElementById("intro-modal-container"));
		this.gallery = new Gallery(document.querySelector(".canvas-container"));
		this.checkGalleryLoad();
		// this.initEventListeners();
	}
	
	checkGalleryLoad() {
		if (this.gallery.isLoaded) {
			this.introModal.hide();
			this.gallery.animate();
		} else {
			console.log(this.gallery.isLoaded);
			setTimeout(() => 
				this.checkGalleryLoad(), 100);
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