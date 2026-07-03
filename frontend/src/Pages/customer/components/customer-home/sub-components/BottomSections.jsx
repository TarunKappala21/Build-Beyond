import "./BottomSections.css";

const BottomSections = () => {
  return (
    <>
      {/* How It Works */}
      <section className="how_it_works">
        <div className="section_heading">
          <h2>How It Works</h2>
          <div className="underline"></div>
        </div>
        <div className="services_tagline">
          <p>
            Our streamlined process ensures your project is completed
            efficiently and to the highest standards, using cutting-edge
            technology.
          </p>
        </div>
        <div className="steps">
          {[
            {
              img: "https://www.wehouse.in/new-assets/images/icon/requirement1.png",
              title: "Your Requirements",
            },
            {
              img: "https://www.wehouse.in/new-assets/images/icon/costestimate1.png",
              title: "Cost Estimation",
            },
            {
              img: "https://www.wehouse.in/new-assets/images/icon/excute1.png",
              title: "Work Execution",
            },
            {
              img: "https://www.wehouse.in/new-assets/images/icon/architecture1.png",
              title: "Satisfied Delivery",
            },
          ].map((s, i) => (
            <div key={i} className="step">
              <img src={s.img} alt={s.title} />
              <div className="step_number">{i + 1}</div>
              <div className="step_title">{s.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* "Build Your Dream Team" section REMOVED */}
    </>
  );
};

export default BottomSections;
