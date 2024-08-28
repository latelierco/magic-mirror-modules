import cv2


class PhotoCam:


    def __init__(self):
        self.cam = None


    def get(self):
        import cv2
        self.cam = cv2.VideoCapture('/dev/video0')
        if not self.cam.isOpened():
            self.cam.open()
            time.sleep(1)
        return self


    def capture(self, img_path):
        res, frame = self.cam.read()
        cv2.imwrite(img_path, frame)


    def stopPreview(self):
        pass


    def stop(self):
        self.cam.release()
