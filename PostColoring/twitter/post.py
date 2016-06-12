import sys
import tweepy
import os
import requests

def twitter_api():
	consumerKeyFile = open("/Users/rowandempster/git/Angelhack/PostColoring/twitter/config.txt","r")
	consumerKey = consumerKeyFile.readline().strip()
	consumerSecret = consumerKeyFile.readline().strip()
	consumerKeyFile.close()

	auth = tweepy.OAuthHandler(consumerKey,consumerSecret)
	auth.secure=True
	authUrl = auth.get_authorization_url()

	#go to this url
	print "Please Visit This link and authorize the app ==> " + authUrl
	print "Enter The Authorization PIN"

	pin = raw_input().strip()
	token = auth.get_access_token(verifier=pin)

	api = tweepy.API(auth)
	return api


def tweet_image(url, message):
    api = twitter_api()
    filename = 'temp.jpg'
    request = requests.get(url, stream=True)
    if request.status_code == 200:
        with open(filename, 'wb') as image:
            for chunk in request:
                image.write(chunk)

        api.update_with_media(filename, status=message)
        os.remove(filename)
    else:
        print("Unable to download image")

print "Enter the url of the iamge"
url = raw_input().strip()
print "Enter tweet hashtags"
message = raw_input().strip()

tweet_image(url, message)
