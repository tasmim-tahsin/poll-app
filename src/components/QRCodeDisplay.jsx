import React from 'react';
import QRCode from 'react-qr-code';

const QRCodeDisplay = ({ qrCodeUrl }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <QRCode
          size={200}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          value={qrCodeUrl}
          viewBox={`0 0 200 200`}
        />
      </div>
      <p className="text-sm text-gray-600 mt-3 text-center max-w-xs break-all">
        {qrCodeUrl}
      </p>
      <button
        onClick={() => navigator.clipboard.writeText(qrCodeUrl)}
        className="mt-2 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition duration-200"
      >
        Copy Link
      </button>
    </div>
  );
};

export default QRCodeDisplay;
