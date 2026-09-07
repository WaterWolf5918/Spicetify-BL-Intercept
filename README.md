# Spicetify-BL-Intercept
## As of 09/07/2026 I have became aware that Beautiful Lyrics no longer works and that the lyrics provider it used no longer exists. 
I never really intended to release this after I stopped working on it, but with the fact that the original servers are dead. I figure this might be useful to someone somewhere. Saying that I have no plans to try and fix this but local lyrics might still work. Unsure as I last used this quite a few version ago.
~~Host file intercept proxy to add custom lyrics to Beautiful Lyrics for Spicetify.~~


### Required stuff
* Deno
* Creating a self signed cert with the following domains for the client and putting them in the client root
Etc ./
  * DNS:	socalifornian.live
  * DNS:	beautiful-lyrics.socalifornian.live
  * DNS:	localhost

* Modifying your hosts file to redirect "beautiful-lyrics.socalifornian.live" to "localhost"
