import { useRef, useState } from 'react';
import { PiCameraFill, PiCameraSlashFill } from 'react-icons/pi';
import './PhotoCapture.css';

interface PhotoCaptureProps {
  onPhotosChange: (photos: string[]) => void;
}

function PhotoCapture({ onPhotosChange }: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [takephoto, setTakephoto] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setTakephoto(true);
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
    }
  };

  const cameraPhoto = () => {
    if (!takephoto === false) {
      takePhoto();
    } else {
      startCamera();
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

  return (
    <div className="element-container full-width">
      <div className="video-wrapper">
        <video ref={videoRef} />
        {!takephoto && (
          <div className="camera-off-overlay">
            <PiCameraSlashFill size={80} />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="camera-controls">
        <button className="take-photo" type="button" onClick={cameraPhoto}>
          <PiCameraFill size={30} />
        </button>
      </div>

      {photos.length > 0 && (
        <div className="photo-preview">
          <h3>Fotos Capturadas:</h3>
          <div className="photos-grid">
            {photos.map((photo, index) => (
              <img
                key={index}
                src={`data:image/jpeg;base64,${photo}`}
                alt={`Foto ${index + 1}`}
                className="photo-item"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoCapture;