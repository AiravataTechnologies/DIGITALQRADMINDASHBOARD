import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, ExternalLink } from "lucide-react";

interface QRCodeModalProps {
  website: string;
  qrCode: string;
  restaurantName: string;
}

export default function QRCodeModal({ website, qrCode, restaurantName }: QRCodeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <QrCode className="w-4 h-4 mr-2" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">QR Code for {restaurantName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code to visit the restaurant website
            </p>
            <div className="flex justify-center mb-4">
              <img
                src={qrCode}
                alt="QR Code for restaurant website"
                className="w-48 h-48 border-2 border-gray-300 rounded-lg shadow-sm"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">Website URL:</p>
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm break-all inline-flex items-center"
              >
                {website}
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}