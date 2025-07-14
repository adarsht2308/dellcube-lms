import Splide from "@splidejs/splide";
import { AutoScroll } from "@splidejs/splide-extension-auto-scroll";

const initSplide = () => {
  document.querySelectorAll(".splide").forEach((el) => {
    if (el.classList.contains("clients-splide-1")) {
      new Splide(el, {
        gap: "2em",
        padding: "5em",
        pagination: false,
        arrows: false,
        perPage: 5,
        perMove: 1,
        type: "loop",
        autoScroll: { speed: 1 },
        breakpoints: {
          1200: { padding: "0em" },
          992: { perPage: 4 },
          768: { perPage: 3 },
          576: { perPage: 2 },
          425: { perPage: 2 },
        },
      }).mount({ AutoScroll });
    }

    if (el.classList.contains("clients-splide-2")) {
      new Splide(el, {
        gap: "2em",
        padding: "10em",
        pagination: false,
        arrows: false,
        perPage: 5,
        focus: "center",
        drag: "free",
        type: "loop",
        autoScroll: { speed: -1 },
        breakpoints: {
          1200: { padding: "5em" },
          992: { perPage: 3 },
          768: { perPage: 2 },
          576: { perPage: 1 },
        },
      }).mount({ AutoScroll });
    }
  });
};

 
document.addEventListener("DOMContentLoaded", initSplide);
export default initSplide;
