#!/usr/bin/env python

import os
import sys
import json



def main(argv):
  request = sys.stdin
  
  print request
  
  json.dump(response, sys.stdout, indent=2)


if __name__ == '__main__':
  main(sys.argv)