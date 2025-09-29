import React, { useState } from 'react';
import { Phone, User, MessageSquare, Send, CheckCircle, MessageCircle } from 'lucide-react';
import { contactService } from '../services/contactService';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await contactService.submitContact(formData);
      toast.success('Thank you for your message! We\'ll get back to you soon.');
      setIsSubmitted(true);
      setFormData({
        name: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      console.error('Contact submission error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-primary-orange pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-accent-yellow rounded-2xl shadow-2xl p-8 md:p-12 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Message Sent Successfully!
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Thank you for reaching out to us. We'll get back to you as soon as possible.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button
                variant="secondary"
                size="large"
                onClick={() => window.location.href = '/'}
                className="inline-block"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-orange pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Single Contact Card */}
          <div>
            <div className="bg-transparent border-2 border-accent-yellow rounded-2xl shadow-2xl p-8 h-full">
              <h1 className="text-4xl md:text-5xl font-bold text-accent-yellow mb-6">
                Contact Us
              </h1>
              <p className="text-xl text-accent-yellow leading-relaxed mb-8">
                We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
              
              {/* Direct Contact Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-accent-yellow" />
                  </div>
                  <h3 className="text-lg font-semibold text-accent-yellow mb-2">Call Us Directly</h3>
                  <p className="text-xl font-bold text-accent-yellow mb-4">+44-7401195090</p>
                  <p className="text-sm text-accent-yellow/80">
                    Available for calls and WhatsApp messages
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-accent-yellow" />
                  </div>
                  <h3 className="text-lg font-semibold text-accent-yellow mb-2">WhatsApp</h3>
                  <p className="text-sm text-accent-yellow/80 mb-4">
                    Send us a message on WhatsApp for quick responses
                  </p>
                  <a 
                    href="https://wa.me/447401195090" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div>
            <div className="bg-transparent border-2 border-accent-yellow rounded-2xl shadow-2xl p-8 h-full">
              <h2 className="text-2xl font-bold text-accent-yellow mb-6">Send us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-accent-yellow mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow transition-colors ${
                    errors.name ? 'border-red-500' : 'border-accent-yellow'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-accent-yellow mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border-2 border-accent-yellow rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow transition-colors"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-accent-yellow mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow transition-colors resize-vertical ${
                    errors.message ? 'border-red-500' : 'border-accent-yellow'
                  }`}
                  placeholder="Tell us how we can help you..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {formData.message.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="large"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Message</span>
                  </>
                )}
              </Button>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
