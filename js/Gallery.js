import * as THREE from "three";
import { GLTFLoader, RGBELoader } from "three/examples/jsm/Addons.js";
import gsap from "gsap";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export class Gallery {
	constructor(container) {
		this.isRendered = false;
		this.onFirstRender = null;
		this.container = container;
		this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			60,
			window.innerWidth / window.innerHeight,
			0.1,
			500
		);
		this.renderer = this.initRenderer();
		this.controls = this.initControls();

		this.clickableObjects = [];
		this.isIncrease = false;
		this.photoNum = 0;
		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();

		this.isTouching = false;
		this.startX = 0;
		this.startY = 0;
		this.touchStartTime = 0;
		this.THRESHOLD = 5;
		this.MAX_TOUCH_DURATION = 500;

		this.startingPosition;
		this.startingRotation;
		// this.initHDR();

		this.initLights();
		this.initEventListeners();
		this.loadGalleryModel();
		this.animate();
	}

	initRenderer() {
		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			powerPreference: this.isMobile ? "default" : "high-performance",
			precision: this.isMobile ? "mediump" : "highp",
			alpha: true,
		});
		
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ReinhardToneMapping;
		renderer.toneMappingExposure = 1.2;
		
		const pixelRatio = Math.min(window.devicePixelRatio, 2);
		renderer.setPixelRatio(pixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);

		renderer.sortObjects = true;
		this.container.appendChild(renderer.domElement);
		return renderer;
	}
	initControls() {
		const controls = new OrbitControls(this.camera, this.renderer.domElement);
		controls.rotateSpeed = -0.5;
		return controls;
	}

	initLights() {
		const ambientLight = new THREE.AmbientLight(0xffffff, 3.5);
		this.scene.add(ambientLight);
	}
	
	initHDR() {
		const loaderHdr = new RGBELoader();
		loaderHdr.setPath("/hdr/");

		loaderHdr.load("studio_small_01_1k.hdr", (texture) => {
			texture.mapping = THREE.EquirectangularReflectionMapping;

			const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
			pmremGenerator.compileEquirectangularShader();
			if (this.isMobile) {
				pmremGenerator.maxTextureSize = 256;
			}

			const envMap = pmremGenerator.fromEquirectangular(texture).texture;

			this.scene.background = envMap;
			this.scene.environment = envMap;

			texture.dispose();
			pmremGenerator.dispose();
		},
		undefined,
		(error) => {
			console.error("HDR 로드 중 에러 발생:", error);
		}
	);
	}

	loadGalleryModel() {
		const loader = new GLTFLoader();
		loader.load(
			"/model/gallery.glb",
			(gltf) => this.handleModelLoad(gltf),
			undefined,
			(error) => console.error("GLTF 로드 중 에러 발생:", error)
		);
	}

	handleModelLoad(gltf) {
		const model = gltf.scene;
		
		this.camera.position.copy(gltf.cameras[0].position);
		this.startingPosition = this.camera.position.clone();
		this.camera.rotation.copy(gltf.cameras[0].rotation);
		this.startingRotation = this.camera.rotation.clone();
		this.controls.object = this.camera;
		this.controls.target.set(this.camera.position.x - 0.5, this.camera.position.y, this.camera.position.z + 1);
		document.querySelector(".navigation-overlay").style.display = "flex";
		this.setupModel(model);
		this.scene.add(model);
	}

	// setupCamera(targetPosition) {
	// 	const viewHeight = 1.2;
	// 	const offsetWall = 1.18;
	// 	const distance = 2.2;

	// 	this.camera.position.set(
	// 		targetPosition.x - distance,
	// 		viewHeight,
	// 		targetPosition.z + (offsetWall - 0.01)
	// 	);

	// 	this.controls.object = this.camera;
	// 	this.controls.target.set(
	// 		this.camera.position.x + 1,
	// 		this.camera.position.y,
	// 		this.camera.position.z
	// 	);
	// 	this.controls.update();
	// 	document.querySelector(".navigation-overlay").style.display = "flex";
	// }

	setupModel(model) {
		model.traverse((c) => {
			if (c.userData.photo != undefined) {
				this.clickableObjects.push({
					object: c,
					targetPosition: c.position,
				});
				// if (c.userData.photo === 1) {
				// 	this.setupCamera(c.position);
				// 	document.querySelector(".page-number").textContent = `${this.photoNum}`;
				// }
			}
		})
	}

	handleClickOrTouch(x, y) {
		this.mouse.x = (x / window.innerWidth) * 2 - 1;
    this.mouse.y = -(y / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
    	this.clickableObjects.map(o => o.object)
    );

    if (intersects.length > 0) {
      this.handleIntersection(intersects[0].object);
    }
	}

	handleIntersection(clickedObject) {
		
		const target = this.clickableObjects.find(o => o.object === clickedObject).targetPosition;
		
		if (clickedObject.userData.photo != undefined) {
			const photoNumber = clickedObject.userData.photo;
			if (this.photoNum === photoNumber) return ;
			this.photoNum = photoNumber;
			this.moveCamera(target);
		}
	}

	moveCamera(target) {
		this.controls.enabled = false;
		const viewHeight = 1.2;
		const offsetWall = 1.17;
		const distance = 2.2;

		const newPosition = new THREE.Vector3(target.x, viewHeight, target.z);
		if (this.photoNum <= 4) {
		newPosition.z += offsetWall;
		newPosition.x -= distance;
		} else if (this.photoNum <= 7) {
			newPosition.x -= offsetWall;
			newPosition.z -= distance;
		} else if (this.photoNum <= 11) {
			newPosition.z -= offsetWall;
			newPosition.x += distance;
		} else if (this.photoNum <= 15) {
				newPosition.x += offsetWall;
				newPosition.z += distance;
		}
		gsap.timeline()
			.fromTo(this.camera.position, 
				{
					x: this.camera.position.x,
					y: this.camera.position.y,
					z: this.camera.position.z
				},
				{
					x: newPosition.x,
					y: newPosition.y,
					z: newPosition.z,
					duration: 1.2,
					ease: "power1.out",
					onUpdate: () => {
						if (this.photoNum === 1 && this.isIncrease) {
							this.camera.lookAt(new THREE.Vector3(newPosition.x + 1, newPosition.y, newPosition.z));
							this.controls.target.set(newPosition.x + 1, newPosition.y, newPosition.z);
						}	else if (this.photoNum === 4 && !this.isIncrease) {
							this.camera.lookAt(new THREE.Vector3(newPosition.x + 1, newPosition.y, newPosition.z));
							this.controls.target.set(newPosition.x + 1,  newPosition.y, newPosition.z);
						} else if (this.photoNum === 5 && this.isIncrease) {
							this.camera.lookAt(new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z + 1));
							this.controls.target.set(newPosition.x, newPosition.y, newPosition.z + 1);
						} else if (this.photoNum === 7 && !this.isIncrease) {
							this.camera.lookAt(new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z + 1));
							this.controls.target.set(newPosition.x, newPosition.y, newPosition.z + 1);
						} else if (this.photoNum === 8 && this.isIncrease) {
							this.camera.lookAt(new THREE.Vector3(newPosition.x - 1, newPosition.y, newPosition.z));
							this.controls.target.set(newPosition.x - 1, newPosition.y, newPosition.z);
						} else if (this.photoNum === 11 && !this.isIncrease) {
							this.camera.lookAt(new THREE.Vector3(newPosition.x - 1, newPosition.y, newPosition.z));
							this.controls.target.set(newPosition.x - 1, newPosition.y, newPosition.z);
						} else if (this.photoNum === 12 && this.isIncrease) {
							this.camera.lookAt(new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z - 1));
							this.controls.target.set(newPosition.x, newPosition.y, newPosition.z - 1);
						} else if (this.photoNum === 15 && !this.isIncrease) {
							this.camera.lookAt(new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z - 1));
							this.controls.target.set(newPosition.x, newPosition.y, newPosition.z - 1);
						}
					},
					onComplete: () => {
						this.controls.enabled = true;
						if (this.photoNum <= 4) {
							this.camera.lookAt(new THREE.Vector3(newPosition.x + 1, newPosition.y, newPosition.z));
							this.controls.target.set(newPosition.x + 1, newPosition.y, newPosition.z);
						} else if (this.photoNum <= 7) {
							this.camera.lookAt(new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z + 1));
							this.controls.target.set(newPosition.x, newPosition.y, newPosition.z + 1);
						} else if (this.photoNum <= 11) {
							this.camera.lookAt(new THREE.Vector3(newPosition.x - 1, newPosition.y, newPosition.z));
							this.controls.target.set(newPosition.x - 1, newPosition.y, newPosition.z);
						}	else if (this.photoNum <= 15) {
							this.camera.lookAt(new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z - 1));
							this.controls.target.set(newPosition.x, newPosition.y, newPosition.z - 1);
						}
					}
				}
			);
		document.querySelector(".page-number").textContent = `${this.photoNum}`;
	}

	initEventListeners() {
		window.addEventListener('click', (e) => {
			this.handleClickOrTouch(e.clientX, e.clientY);
		});
		
		document.querySelector(".navigation-overlay").addEventListener("click", (e) => {
			const button = e.target.closest(".nav-btn");
			if (!button) return;

			if (button.classList.contains("next-btn")) {
				if (this.photoNum === 4 || this.photoNum === 7 || this.photoNum === 11 || this.photoNum === 15) {
					this.isIncrease = true;
				} else {
					this.isIncrease = true;
				}
				this.photoNum = this.photoNum >= 15 ? 0 : this.photoNum + 1;
			}
			if (button.classList.contains("prev-btn")) {
				if (this.photoNum === 5 || this.photoNum === 8 || this.photoNum === 12 || this.photoNum === 1) {
					this.isIncrease = false;
				} else {
					this.isIncrease = false;
				}
				this.photoNum = this.photoNum <= 0 ? 15 : this.photoNum - 1;
			}
			if (this.photoNum === 0) {
				gsap.timeline()
						.fromTo(this.camera.position, 
				{
					x: this.camera.position.x,
					y: this.camera.position.y,
					z: this.camera.position.z
				},
				{
					x: this.startingPosition.x,
					y: this.startingPosition.y,
					z: this.startingPosition.z,
					duration: 1.2,
					ease: "power1.out",
					onUpdate: () => {
						this.camera.lookAt(new THREE.Vector3(this.startingPosition.x - 0.5, this.startingPosition.y, this.startingPosition.z + 1));
						this.controls.target.set(this.startingPosition.x - 0.5, this.startingPosition.y, this.startingPosition.z + 1);
					},
					onComplete: () => {
						this.controls.enabled = true;
						this.camera.lookAt(new THREE.Vector3(this.startingPosition.x - 0.5, this.startingPosition.y, this.startingPosition.z + 1));
						this.controls.target.set(this.startingPosition.x - 0.5, this.startingPosition.y, this.startingPosition.z + 1);
					}
				}
				);
				document.querySelector(".page-number").textContent = 'Gallery';
				return ;
			}
			const target = this.clickableObjects.find(o => o.object.userData.photo === this.photoNum).targetPosition;
			this.moveCamera(target);
		});
	}

	animate() {
		if (!this.isRendered) {
			// this.isRendered = true;

			this.renderer.render(this.scene, this.camera);

			this.renderer.getContext().flush();
		}
		
		// requestAnimationFrame(this.animate.bind(this));
		requestAnimationFrame(() => this.animate());
		this.renderer.render(this.scene, this.camera);
	}
}

// // scene, camera, renderer 생성
// const scene = new THREE.Scene();

// const camera = new THREE.PerspectiveCamera(
// 	60,
//   window.innerWidth / window.innerHeight,
//   0.1,
//   500
// );

// const renderer = new THREE.WebGLRenderer();
// renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.toneMappingExposure = 0.3;
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// const loaderHdr = new RGBELoader();
// loaderHdr.setPath("/hdr/");

// loaderHdr.load("goegap_road_1k.hdr", (texture) => {
// 	texture.mapping = THREE.EquirectangularReflectionMapping;

// 	const pmremGenerator = new THREE.PMREMGenerator(renderer);
// 	const envMap = pmremGenerator.fromEquirectangular(texture).texture;

// 	scene.background = envMap;
// 	scene.environment = envMap;

// 	texture.dispose();
// 	pmremGenerator.dispose();
// });

// // controls 생성
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.rotateSpeed = -0.5;

// // 원형 마크
// const ringGeometry = new THREE.RingGeometry(3, 4);
// const ringMaterial = new THREE.MeshBasicMaterial(
//   { color: 0xffffff,
//     opacity: 0.5,
//     transparent: true,
//     side: THREE.DoubleSide
//   });

// // 클릭 가능 객체
// const clickableGeometry = new THREE.CircleGeometry(4, 32);
// const clickableMaterial = new THREE.MeshBasicMaterial(
//   {
//     opacity: 0,
//     transparent: true,
//     side: THREE.DoubleSide
//   });

// // 클릭 가능 객체를 담을 배열
// const clickableObjects = [];

// const loader = new GLTFLoader();
// loader.load(
//     "/model/gallery.glb",
//     (gltf) => {
//       let model;
//       model = gltf.scene;
      
//       // 카메라 로드
//       const loadedCamera = gltf.cameras[0];
//       if (loadedCamera) {
// 				camera.position.copy(loadedCamera.position);
//         camera.rotation.copy(loadedCamera.rotation);

//         controls.object = camera;
//         controls.target.set(camera.position.x, camera.position.y, camera.position.z - 1);
//         controls.update();
//       }
//       // 구획별로 1개의 원, 그리고 복도에 4개
//       const positions = [
//         {x: 2, y: 0.7, z: -20},// 1st cirle
//         {x: -12, y: 0.7, z: -60},// 2nd circle
//         {x: 2, y: 0.7, z: -113},// 3rd circle
//         {x: -12, y: 0.7, z: -154},// 4th circle
//         {x: 2, y: 0.7, z: -207.5},// 5th circle
//       ];
//       positions.forEach((pos) => {
//         const ring = new THREE.Mesh(ringGeometry, ringMaterial);
//         ring.position.set(pos.x, pos.y, pos.z);
//         ring.rotation.x = Math.PI / 2;
//         scene.add(ring);
        
//         const clickableArea = new THREE.Mesh(clickableGeometry, clickableMaterial);
//         clickableArea.position.set(pos.x, pos.y, pos.z);
//         clickableArea.rotation.x = Math.PI / 2;
//         scene.add(clickableArea);
        
//         clickableObjects.push(
//           { 
//             object: clickableArea,
//             targetPosition: pos
//           }
//         );
//       });
//       model.traverse((c) => {
// 				if (c.isMesh) {
// 					c.castShadow = true;
// 					c.receiveShadow = true;
// 				}
// 				if (c.userData.glass) {
// 					c.material = new THREE.MeshPhysicalMaterial({
// 						color: 0xffffff,
// 						transparent: true,
// 						opacity: 0.3,
// 						transmission: 1,
// 						roughness: 0.1,
// 						side: THREE.DoubleSide,
// 					});
// 				}
//         if (c.userData.photo != undefined)
//         {
//           clickableObjects.push({
//             object: c,
//             targetPosition: c.position
//           });
//         }
//       });
      
//       scene.add(model);
//     },
//     undefined,
//     (error) => {
//       console.error("GLTF 로드 중 에러 발생:", error);
//     }
//   );

// let ambientLight, hemiLight;
// let rectLightLongLeftWall, rectLightLongRightWall, rectLightEndWall, rectLightFrontWall;
// function setLights() {
//   // 주변 광원
//   ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
//   scene.add(ambientLight);

// 	// hemiLight = new THREE.HemisphereLight(0xf0f0f0, 0x404040, 2);
// 	// scene.add(hemiLight);

// 	// 긴 복도 왼쪽 벽면
//   // rectLightLongLeftWall = new THREE.RectAreaLight(0xffffff, 25, 0.5, 287);
//   // rectLightLongLeftWall.position.set(-26.3, 0.4, -111);
//   // rectLightLongLeftWall.rotation.x = Math.PI / 2;
//   // scene.add(rectLightLongLeftWall);

// 	// 긴 복도 오른쪽 벽면
//   // rectLightLongRightWall = new THREE.RectAreaLight(0xffffff, 25, 0.5, 287);
//   // rectLightLongRightWall.position.set(20.2, 0.5, -111);
//   // rectLightLongRightWall.rotation.x = Math.PI / 2;
//   // scene.add(rectLightLongRightWall);

// 	// 복도 끝 벽면
// 	// rectLightEndWall = new THREE.RectAreaLight(0xffffff, 25, 0.5, 54);
//   // rectLightEndWall.position.set(0.7, 0.4, -234.05);
//   // rectLightEndWall.rotation.set(Math.PI / 2, 0, Math.PI / 2);
//   // scene.add(rectLightEndWall);

// 	// 복도 시작 벽면
// 	// rectLightFrontWall = new THREE.RectAreaLight(0xffffff, 25, 0.5, 54);
//   // rectLightFrontWall.position.set(0.7, 0.4, 8.4);
//   // rectLightFrontWall.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
//   // scene.add(rectLightFrontWall);
// }

// // 사진 모달창인지 확인
// let isPhoto = false;

// // Raycaster와 마우스 벡터 초기화
// const raycaster = new THREE.Raycaster();
// const mouse = new THREE.Vector2();

// function handleClickOrTouch(x, y) {
//   // 마우스 좌표 정규화
//   mouse.x = (x / window.innerWidth) * 2 - 1;
//   mouse.y = -(y / window.innerHeight) * 2 + 1;

//   // Raycaster로 클릭한 객체 찾기
//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObjects(clickableObjects.map(o => o.object));

//   if (intersects.length > 0) {
// 		// 클릭된 원 찾기
// 		if (isPhoto) return;
//     controls.enabled = false;
//     const clickedObject = intersects[0].object;
    
//     // 클릭된 원의 목표 위치 가져오기
//     const target = clickableObjects.find(o => o.object === clickedObject).targetPosition;

//     // 전역변수 move = true/false
//     // GSAP 로 카메라 이동
//     if (clickedObject.userData.photo != undefined) {
// 			isPhoto = true;
//       controls.enabled = true;
//       const modalContainer = document.getElementById("modal-container");
//       let modalImage = document.getElementById("modal-image");
//       modalImage.style.animation = "scaleUp 0.4s ease-out forwards";
//       switch (clickedObject.userData.photo) {
//         case 1:
//           modalImage.src = "/images/1.jpg";
//           break;
//         case 2:
//           modalImage.src = "/images/2.jpg";
//           break;
//         case 3:
//           modalImage.src = "/images/3.jpg";
//           break;
//         case 4:
//           modalImage.src = "/images/4.jpg";
//           break;
//         case 5:
//           modalImage.src = "/images/5.jpg";
//           break;
//         case 6:
//           modalImage.src = "/images/6.jpg";
//           break;
//         case 7:
//           modalImage.src = "/images/7.jpg";
//           break;
//         case 8:
//           modalImage.src = "/images/8.jpg";
//           break;
//       }
//       modalContainer.style.display = "flex";
//       return ;
//     }
//     // -> 화면의 잔움직임 + 원을 눌렀을 때 position을 토대로 카메라를 옮겨버림
//     gsap.to(camera.position, {
//       x: target.x,
//       y: 11,
//       z: target.z,
//       duration: 1.5,
//       ease: "power2.inOut",
//       onUpdate: () => {
//         if (target.x == 2) {
//           // 그림 앞으로 이동할 때
//           camera.lookAt(new THREE.Vector3(target.x - 1, 11, target.z));
//           controls.target.set(target.x - 1, 11, target.z);
//         } else if (camera.position.z > target.z) {
//           // 카메라가 복도 앞에서 뒤로 이동할 때
//           camera.lookAt(new THREE.Vector3(target.x, 11, target.z - 1));
//           controls.target.set(target.x, 11, target.z - 1);
//         } else if (camera.position.z < target.z) {
//           // 카메라가 복도 뒤에서 앞으로 이동할 때
//           camera.lookAt(new THREE.Vector3(target.x, 11, target.z + 1));
//           controls.target.set(target.x, 11, target.z + 1);
//         }
//       },
//       onComplete: () => {
//         controls.enabled = true;
//       }
//     });
//   }
// }

// function animate() {
// 	requestAnimationFrame(animate);
//   renderer.render(scene, camera);
// }

// function closeImageModal() {
// 	document.getElementById("modal-image").style.animation = "scaleDown 0.4s ease-out forwards";
//   setTimeout(() => {
// 		document.getElementById("modal-container").style.display = "none";
// 		isPhoto = false;
//   }, 400);
// }


// // touch event
// let isTouching = false;
// let startX = 0, startY = 0;
// let touchStartTime = 0;

// const THRESHOLD  = 5;
// const MAX_TOUCH_DURATION = 500;

// function initEventListeners() {

//   // 사진 모달창 x 버튼 닫기
//   document.getElementById("close-modal").addEventListener("click", (e) => {
// 		if (isTouching) return;
// 		closeImageModal();
// 	});

//   // 사진 모달창 외부 클릭시 닫기
//   document.getElementById("modal-container").addEventListener("click", (e) => {
// 		if (isTouching) return;
//     if (e.target.id === "modal-container") {
//       closeImageModal();
//     }
//   });

// 	// 사진 모달창 x 버튼 터치 이벤트
// 	document.getElementById("close-modal").addEventListener("touchstart", (e) => {
// 		if (e.touches.length > 1) return;
// 		isTouching = true;

// 		const touch = e.touches[0];
// 		startX = touch.clientX;
// 		startY = touch.clientY;
// 		touchStartTime = Date.now();
// 	});

// 	document.getElementById("close-modal").addEventListener("touchend", (e) => {
// 		if (!isTouching) return;
// 		e.preventDefault();
// 		e.stopImmediatePropagation();
// 		const touch = e.changedTouches[0];
// 		const endX = touch.clientX;
// 		const endY = touch.clientY;

// 		const deltaX = Math.abs(endX - startX);
// 		const deltaY = Math.abs(endY - startY);
// 		const touchDuration = Date.now() - touchStartTime;
// 		if (deltaX < THRESHOLD && deltaY < THRESHOLD && touchDuration <= MAX_TOUCH_DURATION) {
// 			closeImageModal();
// 		}
// 		isTouching = false;
// 	});

// 		// 사진 모달창 x 버튼 터치 이벤트
// 		document.getElementById("modal-container").addEventListener("touchstart", (e) => {
// 			if (e.touches.length > 1) return;
// 			isTouching = true;
	
// 			const touch = e.touches[0];
// 			startX = touch.clientX;
// 			startY = touch.clientY;
// 			touchStartTime = Date.now();
// 		});
	
// 		document.getElementById("modal-container").addEventListener("touchend", (e) => {
// 			if (!isTouching) return;
// 			e.preventDefault();
// 			e.stopImmediatePropagation();
// 			const touch = e.changedTouches[0];
// 			const endX = touch.clientX;
// 			const endY = touch.clientY;
	
// 			const deltaX = Math.abs(endX - startX);
// 			const deltaY = Math.abs(endY - startY);
// 			const touchDuration = Date.now() - touchStartTime;
// 			if (deltaX < THRESHOLD && deltaY < THRESHOLD && touchDuration <= MAX_TOUCH_DURATION) {
// 				closeImageModal();
// 			}
// 			isTouching = false;
// 		});

//   // mouse click event
//   window.addEventListener("click", (e) => {
// 		if (isTouching)			return;
//     handleClickOrTouch(e.clientX, e.clientY);
//   });

//   // touch event
//   window.addEventListener("touchstart", (e) => {
//     if (e.touches.length > 1) return;
  
//     isTouching = true;
//     // 터치 시작 좌표 저장
//     const touch = e.touches[0];
//     startX = touch.clientX;
//     startY = touch.clientY;
//     // 터치 시작 시간 저장
//     touchStartTime = Date.now();
//   });

//   window.addEventListener("touchend", (e) => {
//     if (!isTouching) return;
// 			e.preventDefault();
//     	e.stopImmediatePropagation();
//       const touch = e.changedTouches[0];
//       const endX = touch.clientX;
//       const endY = touch.clientY;
  
//       const deltaX = Math.abs(endX - startX);
//       const deltaY = Math.abs(endY - startY);
//       const touchDuration = Date.now() - touchStartTime;
  
//       if (deltaX < THRESHOLD && deltaY < THRESHOLD && touchDuration <= MAX_TOUCH_DURATION) {
//         handleClickOrTouch(touch.clientX, touch.clientY);
//       }
//       isTouching = false;
//   });
// }

// // setLights();
// // animate();
