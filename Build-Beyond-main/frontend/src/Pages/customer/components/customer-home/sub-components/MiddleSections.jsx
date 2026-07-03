import "./MiddleSections.css";

const MiddleSections = ({ openModal }) => {
  return (
    <>
      {/* Vision & Mission */}
      <section className="vision_mission_section">
        <div className="section_heading">
          <h2>Our Vision & Mission</h2>
          <div className="underline"></div>
        </div>
        <div className="vm_container">
          <div className="vm_card">
            <h3 className="vm_title">Our Vision</h3>
            <p className="vm_description">
              To revolutionize the construction industry through innovation,
              technology, and sustainable practices...
            </p>
          </div>
          <div className="vm_card">
            <h3 className="vm_title">Our Mission</h3>
            <p className="vm_description">
              To deliver exceptional construction services that exceed client
              expectations...
            </p>
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section className="portfolio_section">
        <div className="section_heading">
          <h2>Our Portfolio</h2>
          <div className="underline"></div>
        </div>
        <div className="services_tagline">
          <p>
            Explore our diverse portfolio of residential and commercial
            projects...
          </p>
        </div>
        <div className="portfolio_grid">
          {[
            {
              img: "https://5.imimg.com/data5/DV/PM/KZ/SELLER-72070424/school-building-design.JPG",
              loc: "Kondapur, Hyderabad",
              size: "40,000 Sft",
            },
            {
              img: "https://archello.com/thumbs/images/2018/05/11/tobiarchitects1.1526035990.6946.jpg?fit=crop&w=414&h=276",
              loc: "Gachibowli, Hyderabad",
              size: "3,200 Sft",
            },
            {
              img: "https://prosperityinfra.com/wp-content/uploads/2024/09/JLL_Hyderabad_Issara_9238_EXT_1.jpg",
              loc: "Jubilee Hills, Hyderabad",
              size: "5,800 Sft",
            },
            {
              img: "https://media.istockphoto.com/id/1165384568/photo/europe-modern-complex-of-residential-buildings.jpg?s=612x612&w=0&k=20&c=iW4NBiMPKEuvaA7h8wIsPHikhS64eR-5EVPfjQ9GPOA=",
              loc: "Banjara Hills, Hyderabad",
              size: "4,500 Sft",
            },
            {
              img: "https://static.vecteezy.com/system/resources/thumbnails/040/813/403/small_2x/building-design-render-photo.jpg",
              loc: "Manikonda, Hyderabad",
              size: "2,800 Sft",
            },
          ].map((p, i) => (
            <div
              key={i}
              className="portfolio_item"
              onClick={() => openModal(p.img)}
            >
              <img src={p.img} alt="Project" />
              <div className="watermark">Build & Beyond</div>
              <div className="portfolio_info">
                <div className="portfolio_location">{p.loc}</div>
                <div className="portfolio_size">{p.size}</div>
              </div>
            </div>
          ))}
          <div className="highlight_box">
            <h2>Explore More Projects</h2>
            <p>
              Discover our full portfolio of innovative constructions and
              designs.
            </p>
            <a href="#" className="more_button">
              View More
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default MiddleSections;
