"use client";

import { useState } from "react";
import { Phone, MessageCircle, Send, Mail, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactMultiButtonProps {
  onOpenCallModal?: () => void;
}

const ContactMultiButton = ({ onOpenCallModal }: ContactMultiButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const contacts = [
    {
      icon: Phone,
      label: "Позвонить",
      action: () => {
        window.location.href = "tel:+79652841415";
      },
      color: "bg-primary",
    },
    {
icon: MessageCircle,
      label: "MAX",
      action: () => {
        window.open(
          "https://max.ru/u/f9LHodD0cOIXEPJot15IEj_2EIeaAZsKSjeCGIcybYIybHk3HTuHQ3LCd-Y",
          "_blank",
        );
      },
      color: "bg-primary",
    },
    {
      icon: Send,
      label: "Telegram",
      action: () => {
        window.open("https://t.me/lidergarant", "_blank");
      },
      color: "bg-primary",
    },
    {
      icon: PhoneCall,
      label: "Обратный звонок",
      action: () => {
        onOpenCallModal?.();
        setIsOpen(false);
      },
      color: "bg-primary",
    },
    {
      icon: Mail,
      label: "Email",
      action: () => {
        window.location.href = "mailto:info@lider-garant.ru";
      },
      color: "bg-primary",
    },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            size="icon-lg"
            className="w-14 h-14 btn-three"
          >
            <Phone className="w-6 h-6" />
          </Button>

          <div
            className={`absolute bottom-16 right-0 space-y-2 transition-all duration-300 ${
              isOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            {contacts.map((contact, index) => (
              <div
                key={index}
                className={`flex items-center justify-end transition-all duration-300 ${
                  isOpen
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-4"
                }`}
                style={{
                  transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
                }}
              >
                <span className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow whitespace-nowrap">
                  {contact.label}
                </span>
                <Button
                  onClick={contact.action}
                  size="icon"
                  className={`w-10 h-10 rounded-full ${contact.color} text-white shadow-md transition-all duration-200 hover:scale-110`}
                >
                  <contact.icon className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactMultiButton;
