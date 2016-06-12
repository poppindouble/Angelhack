import sys
import tweepy
import os
import requests

def twitter_api():
  auth = tweepy.OAuthHandler('swaQskryPDWxSG98D12Q80GKj', 'qrSb8UuBr1nIrEYVObPBuA3yO8hzqymwDINDfS7Qnfsx3WJei0')
  auth.set_access_token('741698627161063425-Jr4gCVs4NncC8pq5Z0ujKgJcVN506uW', 'fOYX56Nfz571EoD7Y2Vd8Uzgb49HAdnFPfNI4ERb0LX5v')
  api = tweepy.API(auth)

	return api


def tweet_image(message):
    api = twitter_api()
    filename = 'Sever/images/image2.png'
    api.update_with_media(filename, status=message)

def main(argv):
    message = argv[1]
    tweet_image(message)

if __name__ == '__main__':
  main(sys.argv)
