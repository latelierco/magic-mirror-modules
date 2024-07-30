class WebCam:


    def __init__(self, cam_type):
        self.cam = None
        self.cam_type = cam_type


    def get(self):
        if (self.cam_type == 'pi'):
            from picamera2 import Picamera2
            self.cam = Picamera2()
            self.cam.configure(cam.create_preview_configuration(main={"size": (resolution[0], resolution[1]), "format": "XRGB8888"}))
            self.cam.start()
            return cam

        import cv2 
        self.cam = cv2.VideoCapture('/dev/video0')
        if not self.cam.isOpened():
            self.cam.open()
            time.sleep(1)
        return self.cam


    def getFrame(self):
        if (self.cam_type == 'pi'):
            return self.cam.capture_array()

        res, frame = self.cam.read()
        return frame
