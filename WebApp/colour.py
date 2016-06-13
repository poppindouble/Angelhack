import numpy as np
import matplotlib.pyplot as plt
import caffe
import os
import sys
import skimage.color as color
import scipy.ndimage.interpolation as sni
import scipy 
import colorsys
from PIL import Image
from PIL import ImageEnhance

# clientsocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# clientsocket.connect(('localhost', 8089))
# plt.rcParams['figure.figsize'] = (12, 6)

def main(argv):
	gpu_id = 0
	caffe.set_mode_cpu()
	# caffe.set_device(gpu_id)
	net = caffe.Net('colorization_deploy_v0.prototxt', 'colorization_release_v0.caffemodel', caffe.TEST)

	(H_in,W_in) = net.blobs['data_l'].data.shape[2:] # get input shape
	(H_out,W_out) = net.blobs['class8_ab'].data.shape[2:] # get output shape
	net.blobs['Trecip'].data[...] = 6/np.log(10000) # 1/T, set annealing temperature

	img_rgb = caffe.io.load_image('./Sever/'+argv[1]+'.png')
	img_lab = color.rgb2lab(img_rgb)
	img_l = img_lab[:,:,0]
	(H_orig,W_orig) = img_rgb.shape[:2]

	img_rs = caffe.io.resize_image(img_rgb,(H_in,W_in))
	img_lab_rs = color.rgb2lab(img_rs)
	img_l_rs = img_lab_rs[:,:,0]
	net.blobs['data_l'].data[0,0,:,:] = img_l_rs-int(argv[2])     #arv[2]
	net.forward()

	ab_dec = net.blobs['class8_ab'].data[0,:,:,:].transpose((1,2,0)) # this is our result
	ab_dec_us = sni.zoom(ab_dec,(1.*H_orig/H_out,1.*W_orig/W_out,1)) # upsample to match size of original image L
	img_lab_out = np.concatenate((img_l[:,:,np.newaxis],ab_dec_us),axis=2) # concatenate with original image L
	img_rgb_out = np.clip(color.lab2rgb(img_lab_out),0,1) # convert back to rgb

	scipy.misc.imsave('./Sever/images/'+argv[1]+'2.png', img_rgb_out)

	img = Image.open('./Sever/images/'+argv[1]+'2.png')
	converter = ImageEnhance.Color(img)
	img2 = converter.enhance(float(argv[3]))   #argv[3]
	scipy.misc.imsave('./Sever/images/'+argv[1]+'2-enhance.png', img2)
	ld = img2.load()
	width, height = img.size
	for y in range(height):
	    for x in range(width):
	        r,g,b = ld[x,y]
	        h,s,v = colorsys.rgb_to_hsv(r/255., g/255., b/255.)
	        h = (h + float(argv[4])/360.0) % 1.0   #argv[4]
	        s = s** float(argv[5])              #argv[5]
	        r,g,b = colorsys.hsv_to_rgb(h, s, v)
	        ld[x,y] = (int(r * 255.9999), int(g * 255.9999), int(b * 255.9999))

	scipy.misc.imsave('./Sever/result.png', img2)
	sys.exit()



if __name__ == '__main__':
	main(sys.argv)

# data_uri = open('/imgs/tower2.jpg' 'rb').read().encode('base64').replace('\n', '')

# clientsocket.send(img_rgb_out)