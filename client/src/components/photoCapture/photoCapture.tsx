import { useRef, useState } from 'react';
import { PiCameraFill } from 'react-icons/pi';

interface PhotoCaptureProps {
  onPhotosChange: (photos: string[]) => void;
}

function PhotoCapture({ onPhotosChange }: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [takephoto, setTakephoto] = useState(false)

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
    }
    else {
      startCamera();
    }
  }

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
    <div className="element-container full-width" style={{ textAlign: 'center', padding: '20px' }}>

      <div
        style={{
          border: '2px solid #ccc',
          width: '320px',
          height: '240px',
          margin: '0 auto',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#f0f0f0',
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="camera-controls" style={{ marginBottom: '20px' }}>
        <button className='take-photo' type="button" onClick={cameraPhoto}> <PiCameraFill /></button>
      </div>

      {photos.length > 0 && (
        <div className="photo-preview" style={{ marginTop: '20px' }}>
          <h3>Fotos Capturadas:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {photos.map((photo, index) => (
              <img
                key={index}
                src={`data:image/jpeg;base64,${photo}`}
                alt={`Foto ${index + 1}`}
                style={{
                  width: '100px',
                  height: '75px',
                  margin: '5px',
                  border: '1px solid #ccc',
                  objectFit: 'cover',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoCapture;