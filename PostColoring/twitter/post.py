import sys
import tweepy
import os
import requests

ACCESS_TOKEN_KEY = '741698627161063425-Jr4gCVs4NncC8pq5Z0ujKgJcVN506uW'
ACCESS_TOKEN_SECRET = 'fOYX56Nfz571EoD7Y2Vd8Uzgb49HAdnFPfNI4ERb0LX5v'




# auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
# auth.secure = True
# auth.set_access_token(ACCESS_TOKEN_KEY, ACCESS_TOKEN_SECRET)

# api = tweepy.API(auth)

# fn = os.path.abspath('http://cdn2.justdogbreeds.com/justdogbreeds-cdn/photos/plog-content/thumbs/dog-breeds/golden-retriever/large/7080-golden-retrieverfds3.jpg')
# #UpdateStatus of twitter called with the image file
# api.update_with_media('http://cdn2.justdogbreeds.com/justdogbreeds-cdn/photos/plog-content/thumbs/dog-breeds/golden-retriever/large/7080-golden-retrieverfds3.jpg', status='#test')





def twitter_api():
    # access_token = config.get('twitter_credentials', 'access_token')
    # access_token_secret = config.get('twitter_credentials', 'access_token_secret')
    # consumer_key = config.get('twitter_credentials', 'consumer_key')
    # consumer_secret = config.get('twitter_credentials', 'consumer_secret')

	# consumerKeyFile = open("/Users/rowandempster/git/Angelhack/PostColoring/twitter/config.txt","r")
	# consumerKey = consumerKeyFile.readline().strip()
	# consumerSecret = consumerKeyFile.readline().strip()
	# consumerKeyFile.close()

	auth = tweepy.OAuthHandler('swaQskryPDWxSG98D12Q80GKj','qrSb8UuBr1nIrEYVObPBuA3yO8hzqymwDINDfS7Qnfsx3WJei0')
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

# url = "http://animalia-life.com/data_images/bird/bird1.jpg"
# message = "Nice one"
tweet_image(url, message)
