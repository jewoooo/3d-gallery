import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import gsap from "gsap";
import { OrbitControls } from "three/examples/jsm/Addons.js";

// scene, camera, renderer 생성
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// controls 생성
const controls = new OrbitControls(camera, renderer.domElement);
controls.rotateSpeed = -0.5;

// 원형 마크
const ringGeometry = new THREE.RingGeometry(2.8, 3.5);
const ringMaterial = new THREE.MeshBasicMaterial(
  { color: 0xffffff,
    opacity: 0.5,
    transparent: true,
    side: THREE.DoubleSide
  });

// 클릭 가능 객체
const clickableGeometry = new THREE.CircleGeometry(3.8, 32);
const clickableMaterial = new THREE.MeshBasicMaterial(
  {
    opacity: 0,
    transparent: true,
    side: THREE.DoubleSide
  });

// 클릭 가능 객체를 담을 배열
const clickableObjects = [];

// 주변 광원
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
ambientLight.position.set(0,0,0);
ambientLight.castShadow = true;
scene.add(ambientLight);

// 긴 복도 벽면
const rectLightLongWall = new THREE.RectAreaLight(0xffffff, 30, 0.5, 287);
rectLightLongWall.position.set(-26.3, 0.4, -111);
rectLightLongWall.rotation.x = Math.PI / 2;
scene.add(rectLightLongWall);

// 복도 끝 벽면
const rectLightEndWall = new THREE.RectAreaLight(0xffffff, 30, 0.5, 54);
rectLightEndWall.position.set(0.7, 0.4, -255);
rectLightEndWall.rotation.set(Math.PI / 2, 0, Math.PI / 2);
scene.add(rectLightEndWall);

// 앞 기둥 세로
const rectLightFrontPillarVertical = new THREE.RectAreaLight(0xffffff, 100, 0.5, 34);
rectLightFrontPillarVertical.position.set(0, 0.62, -67.5);
rectLightFrontPillarVertical.rotation.x = -Math.PI / 2;
scene.add(rectLightFrontPillarVertical);

// 앞 기둥 가로
const rectLightFrontPillarHorizontal1 = new THREE.RectAreaLight(0xffffff, 100, 0.5, 27);
rectLightFrontPillarHorizontal1.position.set(13.5, 0.62, -50.8);
rectLightFrontPillarHorizontal1.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
scene.add(rectLightFrontPillarHorizontal1);

const rectLightFrontPillarHorizontal2 = new THREE.RectAreaLight(0xffffff, 100, 0.5, 27);
rectLightFrontPillarHorizontal2.position.set(13.5, 0.62, -84.3);
rectLightFrontPillarHorizontal2.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
scene.add(rectLightFrontPillarHorizontal2);

// 뒷 기둥 세로
const rectLightBackPillarVertical = new THREE.RectAreaLight(0xffffff, 100, 0.8, 34);
rectLightBackPillarVertical.position.set(0, 0.62, -157.8);
rectLightBackPillarVertical.rotation.x = -Math.PI / 2;
scene.add(rectLightBackPillarVertical);

// 뒷 기둥 가로
const rectLightBackPillarHorizontal1 = new THREE.RectAreaLight(0xffffff, 100, 0.8, 27);
rectLightBackPillarHorizontal1.position.set(13.5, 0.62, -140.8);
rectLightBackPillarHorizontal1.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
scene.add(rectLightBackPillarHorizontal1);

const rectLightBackPillarHorizontal2 = new THREE.RectAreaLight(0xffffff, 100, 0.8, 27);
rectLightBackPillarHorizontal2.position.set(13.5, 0.62, -174.8);
rectLightBackPillarHorizontal2.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
scene.add(rectLightBackPillarHorizontal2);

let model;

const loader = new GLTFLoader();
loader.load(
  "./images/gallery/gallery.glb",
  (gltf) => {
    model = gltf.scene;

    // 카메라 로드
    const loadedCamera = gltf.cameras[0];
    if (loadedCamera) {
      camera.position.copy(loadedCamera.position);
      camera.rotation.copy(loadedCamera.rotation);

      controls.object = camera;
      controls.target.set(camera.position.x, camera.position.y, camera.position.z - 1);
      controls.update();
    }
    const positions = [
      {x: 0, y: 0.7, z: -26},
      {x: -12, y: 0.7, z: -60},
      {x: 0, y: 0.7, z: -113},
      {x: -12, y: 0.7, z: -154},
      {x: 0, y: 0.7, z: -215.5},
    ];
    positions.forEach((pos) => {
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(pos.x, pos.y, pos.z);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      
      const clickableArea = new THREE.Mesh(clickableGeometry, clickableMaterial);
      clickableArea.position.set(pos.x, pos.y, pos.z);
      clickableArea.rotation.x = Math.PI / 2;
      scene.add(clickableArea);
      
      clickableObjects.push(
        { 
          object: clickableArea,
          targetPosition: pos
        }
      );
    });
    model.traverse((c) => {
      if (c.userData.photo != undefined)
      {
        clickableObjects.push({
          object: c,
          targetPosition: c.position
        });
      }
    });
    
    scene.add(model);
  },
  undefined,
  (error) => {
    console.error("GLTF 로드 중 에러 발생:", error);
  }
);

// Raycaster와 마우스 벡터 초기화
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


window.addEventListener("click", (event) => {
  // 마우스 좌표 정규화
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Raycaster로 클릭한 객체 찾기
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects.map(o => o.object));

  if (intersects.length > 0) {
    // 클릭된 원 찾기
    controls.enabled = false;
    const clickedObject = intersects[0].object;
    
    // 클릭된 원의 목표 위치 가져오기
    const target = clickableObjects.find(o => o.object === clickedObject).targetPosition;

    // 전역변수 move = true/false
    // GSAP 로 카메라 이동
    if (clickedObject.userData.photo != undefined) {
      controls.enabled = true;
      const modalContainer = document.getElementById("modal-container");
      let modalImage = document.getElementById("modal-image");
      modalImage.style.animation = "scaleUp 0.4s ease-out forwards";

      switch (clickedObject.userData.photo) {
        case 1:
          modalImage.src = "./images/1.jpg";
          break;
        case 2:
          modalImage.src = "./images/2.jpg";
          break;
        case 3:
          modalImage.src = "./images/3.jpg";
          break;
        case 4:
          modalImage.src = "./images/4.jpg";
          break;
        case 5:
          modalImage.src = "./images/5.jpg";
          break;
        case 6:
          modalImage.src = "./images/6.jpg";
          break;
        case 7:
          modalImage.src = "./images/7.jpg";
          break;
      }
      modalContainer.style.display = "flex";
      return ;
    }

    // -> 화면의 잔움직임 + 원을 눌렀을 때 position을 토대로 카메라를 옮겨머림
    gsap.to(camera.position, {
      x: target.x,
      y: 11,
      z: target.z,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        if (target.x == 0) {
          // 그림 앞으로 이동할 때
          camera.lookAt(new THREE.Vector3(target.x - 1, 11, target.z));
          controls.target.set(target.x - 1, 11, target.z);
        } else if (camera.position.z > target.z) {
          // 카메라가 복도 앞에서 뒤로 이동할 때
          camera.lookAt(new THREE.Vector3(target.x, 11, target.z - 1));
          controls.target.set(target.x, 11, target.z - 1);
        } else if (camera.position.z < target.z) {
          // 카메라가 복도 뒤에서 앞으로 이동할 때
          camera.lookAt(new THREE.Vector3(target.x, 11, target.z + 1));
          controls.target.set(target.x, 11, target.z + 1);
        }
      },
      onComplete: () => {
        controls.enabled = true;
      }
    });
  }
});

function closeImageModal() {
  document.getElementById("modal-image").style.animation = "scaleDown 0.4s ease-out forwards";
  setTimeout(() => {
  document.getElementById("modal-container").style.display = "none";
  }, 400);
}

// 사진 모달창 x 버튼 닫기
document.getElementById("close-modal").addEventListener("click", closeImageModal);

// 사진 모달창 외부 클릭시 닫기
document.getElementById("modal-container").addEventListener("click", (event) => {
  if (event.target.id === "modal-container") {
    closeImageModal();
  }
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function closeLetterModal() {
  document.getElementById("letter-modal-container").style.display = "none";
  animate();
}

document.getElementById("letter-modal-container").addEventListener("click", (e) => {
  if (e.target.id === "letter-modal-container") {
    closeLetterModal();
  }
});

document.getElementById("close-letter-modal").addEventListener("click", closeLetterModal);
