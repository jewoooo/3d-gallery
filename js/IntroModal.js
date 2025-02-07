import gsap from "gsap";

export class IntroModal {
	constructor(container) {
		this.container = container;
		this.speed = 2.3;
		this.init();
		this.initEventListeners();
	}

	init() {
		this.rotationTimeline = gsap.timeline({ repeat: -1 });
		this.opacityTimeline = gsap.timeline({ repeat: -1 });
		this.hologramTimeline = gsap.timeline({ repeat: -1 });

		this.initRotationAnimation();
		this.initOpacityAnimation();
		this.initHologramAnimation();
	}

	initEventListeners() {
		const ticket = document.querySelector(".ticket");
		ticket.addEventListener("mouseenter", () => {
			this.pauseAnimations();
		});
		ticket.addEventListener("mouseleave", () => {
			this.playAnimations();
		});
		// const closeBtn = document.querySelector(".close-card-btn");
		// closeBtn.addEventListener("click", () => {
		// 	const closeEvent = new CustomEvent("close");
		// 	this.container.dispatchEvent(closeEvent);
		// });
	}

	pauseAnimations() {
		this.rotationTimeline.pause();
		this.opacityTimeline.pause();
		this.hologramTimeline.pause();
	}

	playAnimations() {
		this.rotationTimeline.play();
		this.opacityTimeline.play();
		this.hologramTimeline.play();
	}

	initRotationAnimation() {
		this.rotationTimeline
				.to("#intro-modal-container", {
						"--r": "180deg",
						"--p": "0%",
						duration: this.speed,
						ease: "sine.in"
				})
				.to("#intro-modal-container", {
						"--r": "360deg",
						"--p": "100%",
						duration: this.speed,
						ease: "sine.out"
				});
	}

	initOpacityAnimation() {
		this.opacityTimeline
				.to("#intro-modal-container", {
						"--o": 1,
						duration: this.speed/2,
						ease: "power1.in"
				})
				.to("#intro-modal-container", {
						"--o": 0,
						duration: this.speed/2,
						ease: "power1.out"
				});
	}

	initHologramAnimation() {
		this.hologramTimeline
				.to("#intro-modal-container", {
						"--h": "100%",
						duration: this.speed/2,
						ease: "sine.in"
				})
				.to("#intro-modal-container", {
						"--h": "50%",
						duration: this.speed/2,
						ease: "sine.out"
				})
				.to("#intro-modal-container", {
						"--h": "0%",
						duration: this.speed/2,
						ease: "sine.in"
				})
				.to("#intro-modal-container", {
						"--h": "50%",
						duration: this.speed/2,
						ease: "sine.out"
				});
	}
	hide() {
		document.getElementById("intro-modal-container").style.display = "none";

		document.body.classList.remove("modal-open");
	}
}
