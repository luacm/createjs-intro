# Introduction to Making Games with JavaScript with CreateJS
Ever want to make a game, but didn't want to have to bother yourself with learning a troublesome strongly-typed language like C++ or Java? Then making games in JavaScript is for you! Using the fantastic [CreateJS](http://createjs.com) framework, making games in JavaScript is simple! It's designed to mimic much of the Flash API, so those of you that have made Flash games will feel right at home. The source code is heavily documented, so get reading!

## Games? In JavaScript? Won't they be slow?
Nope! Modern JavaScript performance has gotten quite good in modern browsers. You'd be surprised by how much it can handle. That being said, you're not going to get anywhere near the performance of a dedicated desktop application. Still, it's safe to say performance is now comparable to what you could do with Adobe Flash, and that's pretty darn good for not needing a plugin.

## Windows 8 apps can be written in JavaScript. Does that mean I can use CreateJS to make a Windows 8 game?
Yes! Many of the 2D games in the Windows Store (like Cut the Rope) are written in JavaScript. The only thing you have to be careful with is your touch events. You'll want to use MSPointer events instead of traditional mousedown listeners. Otherwise, they won't work with touch! If you don't have a touch screen, you can use the Windows 8 tablet simulator that comes with Visual Studio to simulate touch input.

## How about other mobile platforms? Will these perform well on iOS, Android, and Windows Phone?
It really depends. Windows Phone 8 actually has the fastest JavaScript performance, and you can get near-full speed on that platform. iOS comes in second, performing well, but not anywhere near 60fps. Android, surprisingly, comes in last. It just can't handle it, which is strange considering the JavaScript performance of Chrome on the desktop.

## Where can I learn more about how to use all of the different stuff in CreateJS?
You can find the official documentation for CreateJS [here](http://createjs.com/Docs/EaselJS/modules/EaselJS.html). It's actually very good!
