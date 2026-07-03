// src/Pages/customer/components/customer-home/sub-components/CustomerHomeScripts.jsx
import { useEffect } from "react";

const CustomerHomeScripts = () => {
  useEffect(() => {
    const handleScroll = () => {
      // Back to Top
      const backToTop = document.querySelector(".back_to_top");
      if (backToTop) {
        if (window.scrollY > 400) backToTop.classList.add("visible");
        else backToTop.classList.remove("visible");
      }

      // Values Animation (Fixed: now triggers on scroll)
      document.querySelectorAll(".value_item").forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
          el.classList.add("visible");
          el.style.transitionDelay = `${i * 0.15}s`;
        }
      });

      // Timeline Line (still works if present)
      const line = document.getElementById("timelineLine");
      if (line) {
        let height = 0;
        document.querySelectorAll(".timeline_item").forEach((item) => {
          if (item.getBoundingClientRect().top < window.innerHeight * 0.7) {
            height = item.offsetTop + item.offsetHeight / 2;
            item.querySelector(".icon").style.background = "#facc15";
            item.querySelector(".icon").style.color = "white";
          } else {
            item.querySelector(".icon").style.background = "white";
            item.querySelector(".icon").style.color = "#facc15";
          }
        });
        line.style.height = height + "px";
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
};

export default CustomerHomeScripts;
