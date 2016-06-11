import sys
	
consumerKeyFile = open("/Users/rowandempster/git/Angelhack/PostColoring/twitter/config.txt","r")
consumerKey = consumerKeyFile.readline().strip()
consumerSecret = consumerKeyFile.readline().strip()
consumerKeyFile.close()
	
print consumerKey
print consumerSecret