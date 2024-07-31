import sys, os, tty, time
from pynput.keyboard import Key, Listener
from utils.arguments import Arguments
from utils.photocam import PhotoCam

import os
import sys



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


photo_cam = PhotoCam()
camera = photo_cam.get()

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

print('next photo number: ', next_photo_number)


def getkey():
    tty.setcbreak(sys.stdin.fileno())

    while True:
        b = os.read(sys.stdin.fileno(), 3).decode()

        if len(b) == 3:
            k = ord(b[2])
        else:
            k = ord(b)

        key_mapping = {
            127: 'backspace',
            10: 'return',
            32: 'space',
            9: 'tab',
            27: 'esc',
            65: 'up',
            66: 'down',
            67: 'right',
            68: 'left'
        }
        return key_mapping.get(k, chr(k))


def capturepicture(key):
    global photo_captured    

    if key == 'space':
        global next_photo_number
        # Generate the filename with the format "imgXX.jpg"
        img_filename = f"img{next_photo_number:02d}.jpg"
        next_photo_number += 1
         # Save the image to the specified directory
        img_path = os.path.join(output_dir, img_filename)
        camera.capture(img_path)
        print(f"Photo captured and saved as '{img_filename}' in '{output_dir}'")
        time.sleep(1)  # Wait for 2 seconds to stabilize the image

    if key == Key.esc:
        print("Exiting the application.")
        camera.stop()
        sys.exit()

try:
    while True:
        k = getkey()
        if k == 'esc':
            quit()
        elif k == 'space':
            capturepicture(k)
        else:
            print(k)

except (KeyboardInterrupt, SystemExit):
    camera.stop()
    os.system('stty sane')
    print('stopping.')
