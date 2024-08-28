import sys, os, tty, time
from pynput.keyboard import Key, Listener
from utils.arguments import Arguments
from utils.photocam import PhotoCam

# import the opencv library 
import cv2 


Arguments.prepareCaptureArguments()

# Set your name, which should be used to expand the dataset
name = Arguments.get("user")
if name is None:
    print('\n\t------------------------------------------------------------------- \
    \n\n\tError: please provide option -u or option --user for photo capture \
    \n\n\t-------------------------------------------------------------------\n')
    sys.exit()

# Specifies the directory for saving the images
output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset", name)
# Create the directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)


# define a video capture object 
camera = cv2.VideoCapture(0) 
if not camera.isOpened():
    camera.open()
    time.sleep(1)


# Get the existing image files in the output directory
existing_images = os.listdir(output_dir)

# Determine the starting photo number based on existing files
existing_numbers = set()
for filename in existing_images:
    if filename.startswith("img") and filename.endswith(".jpg"):
        try:
            number = int(filename[3:5])
            existing_numbers.add(number)
        except ValueError:
            pass

if existing_numbers:
    next_photo_number = max(existing_numbers) + 1
else:
    next_photo_number = 1

    print('\n\t------------------------------------------------------------------- \
    \n\n\t              please, press space bar to capture image \
    \n\n\t              next photo number: ' + str(next_photo_number) + ' \
    \n\n\t-------------------------------------------------------------------\n\n')


def capturepicture(key, frame):

    global photo_captured

    if key == 'space':
        global next_photo_number
        # Generate the filename with the format "imgXX.jpg"
        img_filename = f"img{next_photo_number:02d}.jpg"
        next_photo_number += 1
         # Save the image to the specified directory
        img_path = os.path.join(output_dir, img_filename)

        cv2.imwrite(img_path, frame)

        print(f"Photo captured and saved as '{img_filename}' in '{output_dir}'")
        time.sleep(1)  # Wait for 2 seconds to stabilize the image



while(True): 
      
    # Capture the video frame 
    # by frame 
    ret, frame = camera.read() 
  
    # Display the resulting frame 
    cv2.imshow('frame', frame) 
      
    # the 'q' button is set as the 
    # quitting button you may use any 
    # desired button of your choice 


    key = cv2.waitKey(1)

    if key%256 == 32:
        capturepicture('space', frame)

    elif (
        key%256 == 27 or # ESC key
        key%256 == 113 or # q key
        key%256 == 81 # Q key
    ):
        # ESC pressed
        break

  
# After the loop release the cap object 
camera.release() 
# Destroy all the windows 
cv2.destroyAllWindows() 
