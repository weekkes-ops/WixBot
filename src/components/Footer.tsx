import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-luxury-black text-luxury-cream pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-luxury-cream/10 pb-16">
        <div className="space-y-6">
          <Link to="/" className="flex flex-col">
            <span className="text-3xl font-serif tracking-widest uppercase">Calabash</span>
            <span className="text-[10px] uppercase tracking-[0.3em] opacity-60 -mt-1">Real Estate Firm</span>
          </Link>
          <p className="text-sm opacity-60 leading-relaxed font-light">
            Curating the finest luxury properties across the Caribbean. Excellence in service, distinction in properties.
          </p>
          <div className="flex space-x-4">
            <Instagram size={18} className="opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
            <Facebook size={18} className="opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
            <Twitter size={18} className="opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
          </div>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-6">Quick Links</h4>
          <ul className="space-y-4 text-xs uppercase tracking-widest opacity-60">
            <li><Link to="/listings" className="hover:text-luxury-gold transition-colors">All Listings</Link></li>
            <li><Link to="/about" className="hover:text-luxury-gold transition-colors">Our Story</Link></li>
            <li><Link to="/contact" className="hover:text-luxury-gold transition-colors">Contact Us</Link></li>
            <li><Link to="/privacy" className="hover:text-luxury-gold transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-6">Services</h4>
          <ul className="space-y-4 text-xs uppercase tracking-widest opacity-60">
            <li><span className="hover:text-luxury-gold transition-colors cursor-pointer">Property Sales</span></li>
            <li><span className="hover:text-luxury-gold transition-colors cursor-pointer">Luxury Rentals</span></li>
            <li><span className="hover:text-luxury-gold transition-colors cursor-pointer">Investment Advisory</span></li>
            <li><span className="hover:text-luxury-gold transition-colors cursor-pointer">Property Management</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-6">Contact</h4>
          <ul className="space-y-4 text-sm font-light opacity-60">
            <li className="flex items-center gap-3"><MapPin size={16} /> 123 Luxury Way, Holetown, Barbados</li>
            <li className="flex items-center gap-3"><Phone size={16} /> +1 (246) 555-0123</li>
            <li className="flex items-center gap-3"><Mail size={16} /> info@calabashrealestate.com</li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-10 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-[0.2em] opacity-40">
        <p>© 2024 Calabash Real Estate Firm. All Rights Reserved.</p>
        <p>Designed for Excellence</p>
      </div>
    </footer>
  );
}
