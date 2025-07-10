import logo from "../components/img/LOGOS-02-e1721825559257-removebg-preview.png";

function Footer() {
  return (
    <div className="w-[100%] h-0">
      <div className="footer w-full ">
        <div className="border-t border-black mt-8 flex justify-between items-center ">
          <img src={logo} className="w-[15%]" alt="logo" />
          <p>© Tectigon all rights reserved</p>
        </div>
      </div>
    </div>
  );
}

export default Footer;
