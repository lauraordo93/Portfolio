// particlesJS("particles-js", {
//   "particles": {
//     "number": { "value": 80 },
//     "color": { "value": "#00bcd4" },
//     "shape": { "type": "circle" },
//     "opacity": { "value": 0.5 },
//     "size": { "value": 3 },
//     "line_linked": { "enable": true, "distance": 150, "color": "#00bcd4", "opacity": 0.4, "width": 1 },
//     "move": { "enable": true, "speed": 4 }
//   },
//   "interactivity": {
//     "detect_on": "canvas",
//     "events": {
//       "onhover": { "enable": true, "mode": "grab" },
//       "onclick": { "enable": true, "mode": "push" }
//     },
//     "modes": {
//       "grab": { "distance": 140, "line_linked": { "opacity": 1 } },
//       "push": { "particles_nb": 4 }
//     }
//   },
//   "retina_detect": true
// });
particlesJS("particles-js", {
  "particles": {
    "number": { "value": 50 }, // menos partículas, más misterioso
    "color": { "value": "#00bcd4" }, // rojo intenso
    "shape": { "type": "circle" },
    "opacity": {
      "value": 0.6,
      "random": true,
      "anim": { "enable": true, "speed": 1, "opacity_min": 0.1, "sync": false }
    },
    "size": {
      "value": 3,
      "random": true,
      "anim": { "enable": true, "speed": 2, "size_min": 1, "sync": false }
    },
    "line_linked": { "enable": false },
    "move": {
      "enable": true,
      "speed": 0.5, // muy lento
      "direction": "none",
      "random": true,
      "straight": false,
      "out_mode": "out"
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": {
      "onhover": { "enable": false },
      "onclick": { "enable": false }
    }
  },
  "retina_detect": true
});
