#!/usr/bin/env python

import os
import sys
import json

from clarifai.client import ClarifaiApi


def tag_images_in_directory(path, api):
  images = []
  path = path.rstrip(os.sep)
  for fname in os.listdir(path):
    images.append((open(os.path.join(path, fname), 'rb'), fname))
  return api.tag_images(images)


def main(argv):
  imageurl = argv[1]


  api = ClarifaiApi()

  if imageurl.startswith('http'):
    response = api.tag_image_urls(imageurl)
  elif os.path.isdir(imageurl):
    response = tag_images_in_directory(imageurl, api)
  elif os.path.isfile(imageurl):
     with open(imageurl,'rb') as image_file:
       response = api.tag_images(image_file)
  else:
    raise Exception("Must input url, directory path, or file path")



  results = ((((response['results'])[0])['result'])['tag'])['classes']

  print json.dumps(results)

if __name__ == '__main__':
  main(sys.argv)
