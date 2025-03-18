import React, { useRef, useState } from 'react';
import { FaCamera } from 'react-icons/fa';

interface PhotoCaptureProps {
  onPhotosChange: (photos: string[]) => void;
}

function PhotoCapture({ onPhotosChange }: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const photoData = canvasRef.current.toDataURL('image/jpeg', 0.8);
        const newPhotos = [...photos, photoData.split(',')[1]];
        setPhotos(newPhotos);
        onPhotosChange(newPhotos);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="element-container full-width">
      <div className="camera-controls">
        <button type="button" onClick={startCamera}><FaCamera /> Iniciar Cámara</button>
        <button type="button" onClick={takePhoto}>Tomar Foto</button>
        <button type="button" onClick={stopCamera}>Detener Cámara</button>
      </div>
      <video ref={videoRef} style={{ width: '100%', maxHeight: '200px', marginTop: '10px' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="photo-preview">
        {photos.map((photo, index) => (
          <img
            key={index}
            src={`data:image/jpeg;base64,${photo}`}
            alt={`Foto ${index + 1}`}
            style={{ width: '100px', margin: '5px', border: '1px solid #ccc' }}
          />
        ))}
      </div>
    </div>
  );
}

export default PhotoCapture;