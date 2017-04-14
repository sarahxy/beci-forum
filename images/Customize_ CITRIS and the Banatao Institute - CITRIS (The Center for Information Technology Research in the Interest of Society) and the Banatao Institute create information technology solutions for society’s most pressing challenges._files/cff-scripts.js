(function($){ 

	//Toggle comments
	jQuery(document).on('click', '#cff a.cff-view-comments', function(){
		var $commentsBox = jQuery(this).closest('.cff-item').find('.cff-comments-box');
		
		$commentsBox.slideToggle();

		//Add comment avatars
		$commentsBox.find('.cff-comment:visible').each(function(){
			var $thisComment = jQuery(this);
			$thisComment.find('.cff-comment-img img').attr('src', 'https://graph.facebook.com/'+$thisComment.attr("data-id")+'/picture');
		});

	});

	//Set paths for query.php
	if (typeof cffsiteurl === 'undefined' || cffsiteurl == '') cffsiteurl = window.location.host + '/wp-content/plugins';
	var locatefile = true,
		url = cffsiteurl + "/custom-facebook-feed-pro/query.php";

	//Create meta data array for caching likes and comments
	metaArr = {};

	//Loop through the feeds on the page and add a unique attribute to each to use for lightbox groups
	var lb = 0;
	jQuery('#cff.cff-lb').each(function(){
		lb++;
		$(this).attr('data-cff-lb', lb);
	});
	
	//Loop through each item
	jQuery('#cff .cff-item, #cff .cff-album-item').each(function(){

		var $self = jQuery(this);

		//Wpautop fix
		if( $self.find('.cff-viewpost-link, .cff-viewpost-facebook, .cff-viewpost').parent('p').length ){
			//Don't unwrap event only viewpost link
			if( !$self.hasClass('event') ) $self.find('.cff-viewpost-link, .cff-viewpost-facebook, .cff-viewpost').unwrap('p');
		}
		if( $self.find('.cff-photo').parent('p').length ){
			$self.find('p .cff-photo').unwrap('p');
			$self.find('.cff-album-icon').appendTo('.cff-photo:last');
		}
		if( $self.find('.cff-event-thumb').parent('p').length ){
			$self.find('.cff-event-thumb').unwrap('p');
		}
		if( $self.find('.cff-vidLink').parent('p').length ){
			$self.find('.cff-vidLink').unwrap('p');
		}
		if( $self.find('.cff-link').parent('p').length ){
			$self.find('.cff-link').unwrap('p');
		}
		if( $self.find('.cff-viewpost-link').parent('p').length ){
			$self.find('.cff-viewpost-link').unwrap('p');
		}
		if( $self.find('.cff-viewpost-facebook').parent('p').length ){
			$self.find('.cff-viewpost-facebook').unwrap('p');
		}

		if( $self.find('iframe').parent('p').length ){
			$self.find('iframe').unwrap('p');
		}
		if( $self.find('.cff-author').parent('p').length ){
			$self.find('.cff-author').eq(1).unwrap('p');
			$self.find('.cff-author').eq(1).remove();
		}
		if( $self.find('.cff-view-comments').parent('p').length ){
			$self.find('.cff-meta-wrap > p').remove();
			$self.find('.cff-view-comments').eq(1).remove();
			//Move meta ul inside the link element
			var $cffMeta = $self.find('.cff-meta'),
				cffMetaClasses = $cffMeta.attr('class');
			$cffMeta.find('.cff-view-comments').unwrap().wrapInner('<ul class="'+cffMetaClasses+'">');
		}
		if( $self.find('.cff-photo').siblings('.cff-photo').length ){
			$self.find('.cff-photo').slice(0,2).remove();
		}

		//Expand post
		var	expanded = false;
		if( $self.hasClass('cff-event') ){
			var $post_text = $self.find('.cff-desc .cff-desc-text'),
				text_limit = $post_text.parent().attr('data-char');
		} else {
			var $post_text = $self.find('.cff-post-text .cff-text'),
				text_limit = $self.closest('#cff').attr('data-char');
		}

		if (typeof text_limit === 'undefined' || text_limit == '') text_limit = 99999;
		
		//If the text is linked then use the text within the link
		if ( $post_text.find('a.cff-post-text-link').length ) $post_text = $self.find('.cff-post-text .cff-text a');
		var	full_text = $post_text.html();
		if(full_text == undefined) full_text = '';
		var short_text = full_text.substring(0,text_limit);

		//If the short text cuts off in the middle of a <br> tag then remove the stray '<' which is displayed
		var lastChar = short_text.substr(short_text.length - 1);
		if(lastChar == '<') short_text = short_text.substring(0, short_text.length - 1);

		//Cut the text based on limits set
		$post_text.html( short_text );
		//Show the 'See More' link if needed
		if (full_text.length > text_limit) $self.find('.cff-expand').show();
		//Click function
		$self.find('.cff-expand a').unbind('click').bind('click', function(e){
			e.preventDefault();
			var $expand = jQuery(this),
				$more = $expand.find('.cff-more'),
				$less = $expand.find('.cff-less');
			if (expanded == false){
				$post_text.html( full_text );
				expanded = true;
				$more.hide();
				$less.show();
			} else {
				$post_text.html( short_text );
				expanded = false;
				$more.show();
				$less.hide();			
			}
			cffLinkHashtags();
			//Add target to links in text when expanded
			$post_text.find('a').attr('target', '_blank');
		});
		//Add target attr to post text links via JS so aren't included in char count
		$post_text.find('a').add( $self.find('.cff-post-desc a') ).attr({
			'target' : '_blank',
			'rel' : 'nofollow'
		});


		//AJAX
		//Set the path to query.php
		//This is the modified Post ID - so if the post is an album post then this could be the album ID which is used to get the lightbox thumbs
		var post_id = $self.attr('id').substring(4),
			//This is the original post ID which is used to get the number of likes and comments for the timeline post
			post_id_orig = $self.find('.cff-view-comments').attr('id'),
			url = cffsiteurl + "/custom-facebook-feed-pro/query.php?id=" + post_id_orig;
			
		//If the file can be found then load in likes and comments
		if (locatefile == true){
			var $likesCountSpan = $self.find('.cff-likes .cff-count'),
				$commentsCountSpan = $self.find('.cff-comments .cff-count');
			

			//If the likes or comment counts are above 25 then replace them with the query.php values
			if( $likesCountSpan.find('.cff-replace').length ) $likesCountSpan.load(url + '&type=likes body', function(response){

				//If a number is not returned then display 25+
				if( isNaN(response) ){
					$likesCountSpan.html('25+');
				} else {
					//Display the count number
					$likesCountSpan.html(response);
					//Add to cache array
					metaArr[ post_id_orig + '_likes' ] = response;
				}

				//__, __ and 2 others like this
				var $likesCount = $self.find('.cff-comment-likes .cff-comment-likes-count');
				if( $likesCount.length ) {
					if( isNaN(response) ){
						//If the count is returned as 25+ from query.php then change to 23+ to account for -2
						$likesCount.text( '23+' );
					} else {
						$likesCount.text( response -2 );
					}
				}
			});

			if( $commentsCountSpan.find('.cff-replace').length ) $commentsCountSpan.load(url + '&type=comments body', function(response){
				//If a number is not returned then display 25+
				if( isNaN(response) ){
					$commentsCountSpan.html('25+');
				} else {
					//Display the count number
					$commentsCountSpan.html(response);
					//Add to cache array
					metaArr[ post_id_orig + '_comments' ] = response;
				}
			});


		} else {
			$self.find('.cff-replace').show();
			$self.find('.cff-loader').hide();
			$self.find('.cff-lightbox-thumbs-holder').css('min-height', 0);
		}


		//Only show 4 latest comments
		var $showMoreComments = $self.find('.cff-show-more-comments'),
			$comment = $self.find('.cff-comment');

		if ( $showMoreComments.length ) {
			$comment.hide();
			var commentCount = $comment.length,
				commentShow = parseInt( $self.find('.cff-comments-box').attr('data-num') );

			//Show latest few comments based on the number set by the user (data-num on the comments box)
			$comment.slice(commentCount - commentShow).show();
			//Show all on click
			jQuery(document).on('click', '.cff-show-more-comments', function(){
				//Hide 'Show previous comments' link
				jQuery(this).hide();

				//Show comments and add comment avatars
				jQuery(this).siblings('.cff-comment').show().each(function(){
					var $thisComment = jQuery(this);
					$thisComment.find('.cff-comment-img img').attr('src', 'https://graph.facebook.com/'+$thisComment.attr("data-id")+'/picture');
				});

			});
		}


		//Remove event end date day if the same as the start date
		if( $self.hasClass('cff-timeline-event') || $self.hasClass('cff-event') ){
			if( $(this).find('.cff-date .cff-start-date k').text() !== $(this).find('.cff-date .cff-end-date k').text() ) $(this).find('.cff-date .cff-end-date k').show();
		}


		//If a shared link image is 1x1 (after it's loaded) then hide it and add class (as php check for 1x1 doesn't always work)

		// $self.find('.cff-link img').load(function() {
		$self.find('.cff-link img').each(function() {
			var $cffSharedLink = $self.find('.cff-link');
			if( $cffSharedLink.find('img').width() < 10 ) {
				$cffSharedLink.hide().siblings('.cff-text-link').addClass('cff-no-image');
			}
		});


		function cffLinkHashtags(){
			//Link hashtags
			var cffTextStr = $self.find('.cff-text').html(),
				cffDescStr = $self.find('.cff-post-desc').html(),
				// regex = /(?:\s|^)(?:#(?!\d+(?:\s|$)))(\w+)(?=\s|$)/gi,
				// regex = /[#]+[A-Za-z0-9-_]+/g,
				// regex = /(^|\s)#(\w*[a-zA-Z_]+\w*[a-zA-Z_!.?]*)/,

				regex = /(^|\s)#(\w*[a-z\u00E0-\u00FC]+\w*)/gi,
				linkcolor = $self.find('.cff-text').attr('data-color');

			function replacer(hash){
				//Remove white space at beginning of hash
				var replacementString = jQuery.trim(hash);
				//If the hash is a hex code then don't replace it with a link as it's likely in the style attr, eg: "color: #ff0000"
				if ( /^#[0-9A-F]{6}$/i.test( replacementString ) ){
					return replacementString;
				} else {
					return ' <a href="https://www.facebook.com/hashtag/'+ replacementString.substring(1) +'" target="_blank" rel="nofollow" style="color:#' + linkcolor + '">' + replacementString + '</a>';
				}
			}

			if(cfflinkhashtags == 'true'){
				//Replace hashtags in text
				var $cffText = $self.find('.cff-text');
				
				if($cffText.length > 0){
					//Add a space after all <br> tags so that #hashtags immediately after them are also converted to hashtag links. Without the space they aren't captured by the regex.
					cffTextStr = cffTextStr.replace(/<br>/g, "<br> ");
					$cffText.html( cffTextStr.replace( regex , replacer ) );
				}
			}

			//Replace hashtags in desc
			if( $self.find('.cff-post-desc').length > 0 ) $self.find('.cff-post-desc').html( cffDescStr.replace( regex , replacer ) );
		}
		cffLinkHashtags();

		//Add target attr to post text links via JS so aren't included in char count
		$self.find('.cff-text a').attr('target', '_blank');


		//Add lightbox tile link to photos
		if( $self.closest('#cff').hasClass('cff-lb') ){
			$self.find('.cff-photo, .cff-album-cover, .cff-event-thumb, .cff-html5-video, .cff-iframe-wrap').each(function(){
				var $photo = $(this),
					postId = post_id,
					cffLightboxTitle = '',
					cffShowThumbs = false,
					postType = '';

				// if( $self.hasClass('cff-album') || $self.hasClass('cff-albums-only') ) cffShowThumbs = true;
				cffShowThumbs = true;

				//Set the caption/title
				if( $self.hasClass('cff-albums-only') ){
					postType = 'albumsonly';
					cffLightboxTitle = $self.find('img').attr('alt');
				} else if( $self.hasClass('cff-timeline-event') ) {
					cffLightboxTitle = $self.find('.cff-details p').eq(0).text() + ' - ' + $self.find('.cff-details p').eq(1).text();
				} else if ( $self.hasClass('cff-event') ) {
					cffLightboxTitle = $self.find('.cff-date').text();
				} else if( $self.hasClass('cff-album-item') ) {
					cffLightboxTitle = $self.find('img').attr('alt');
				} else {
					// cffLightboxTitle = $self.find('.cff-text').text();
					cffLightboxTitle = String(full_text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
				}


				if(cffLightboxTitle.length > 1) cffLightboxTitle = cffLightboxTitle.replace(/"/g, '&quot;');

				//Create the lightbox link
				//Add the hover tile
				var cffLightboxTile = '<a class="cff-lightbox-link" rel="nofollow" ';

				//If it's a YouTube or Vimeo then set the poster image to use in the lightbox
				if( $photo.hasClass('cff-iframe-wrap') ){
					cffLightboxTile += 'href="'+cffsiteurl+'/custom-facebook-feed-pro/img/video-lightbox.png" data-iframe="'+$photo.find('iframe').attr('src')+'" ';
				//If it's a swf then display it in an iframe
				} else if( $photo.hasClass('cff-swf') ) {
					cffLightboxTile += 'href="'+cffsiteurl+'/custom-facebook-feed-pro/img/video-lightbox.png" data-iframe="'+$photo.find('video').attr('src')+'" ';
				} else {
					cffLightboxTile += 'href="'+$photo.find('img').attr('src')+'" data-iframe="" ';
				}

				//No nav
				// cffLightboxTile += 'data-cff-lightbox="'+postId+'" data-title="'+cffLightboxTitle+'" data-id="'+postId+'" data-thumbs="'+cffShowThumbs+'" ';
				cffLightboxTile += 'data-cff-lightbox="cff-lightbox-'+$self.closest("#cff").attr("data-cff-lb")+'" data-title="'+cffLightboxTitle+'" data-id="'+postId+'" data-thumbs="'+cffShowThumbs+'" ';

				//If it's an HTML5 video then set the data-video attr
				if( $photo.hasClass('cff-html5-video') ){

					if($photo.hasClass('cff-swf')){
						cffLightboxTile += 'data-url="'+$photo.find('.cff-html5-play').attr('href')+'" data-video="';
					} else {
						cffLightboxTile += 'data-url="'+$photo.find('.cff-html5-play').attr('href')+'" data-video="'+$photo.find('video').attr('src');
					}

				//Videos only:
				} else if( $photo.hasClass('cff-video') ) {
					cffLightboxTile += 'data-url="http://facebook.com/'+$photo.attr('id')+'" data-video="'+$photo.attr('data-source');

				} else if( $photo.hasClass('cff-iframe-wrap') ) {
					cffLightboxTile += 'data-url="http://facebook.com/'+post_id+'" data-video="';
				} else {
					cffLightboxTile += 'data-url="'+$photo.attr('href')+'" data-video="';
				}

				cffLightboxTile += '" data-type="'+postType+'"><div class="cff-photo-hover"><i class="fa fa-arrows-alt"></i></div></a>';

				//Add the link to the photos/videos in the feed
				$photo.prepend(cffLightboxTile);

				//Fade in links on hover
				$photo.hover(function(){
					$self.find('.cff-photo-hover').fadeIn(200);
				}, function(){
					$self.find('.cff-photo-hover').stop().fadeOut(600);
				});
			});
		}

		//Share toolip function
		// jQuery(document).on('click', '.cff-share-link', function(){
  		//	 $(this).siblings('.cff-share-tooltip').toggle();
  		// });
		$self.find('.cff-share-link').unbind().bind('click', function(){
            $self.find('.cff-share-tooltip').toggle();
        });


	}); //End .cff-item each



	$('.cff-wrapper').each(function(){
		var $cff = $(this).find('#cff');

		//Allow us to make some tweaks when the feed is narrow
		function cffCheckWidth(){
			if( $cff.innerWidth() < 400 ){
				if( !$cff.hasClass('cff-disable-narrow') ){
					$cff.addClass('narrow');
					//Use full-size shared link images on narrow layout, unless setting is unchecked
					$('.cff-shared-link .cff-link').each(function(){
						$(this).find('img').attr('src', $(this).attr('data-full') );
					});
				}
			} else {
				$cff.removeClass('narrow');
			}
		}
		cffCheckWidth();

		function cffActionLinksPos(){
			if( $cff.innerWidth() < (160 + $('.cff-post-links').innerWidth() ) ){
				$cff.find('.cff-post-links').addClass('cff-left')
			} else {
				$cff.find('.cff-post-links').removeClass('cff-left');
			}
		}
		cffActionLinksPos();

		//Only check the width once the resize event is over
		var cffdelay = (function(){
			var cfftimer = 0;
				return function(cffcallback, cffms){
				clearTimeout (cfftimer);
				cfftimer = setTimeout(cffcallback, cffms);
			};
		})();
		// $(window).resize(function() {
		//     cffdelay(function(){
		//     	cffCheckWidth();
		//     	cffActionLinksPos();
		//     	cffResizeAlbum();
		//     }, 500);
		// });
		window.addEventListener('resize', function(event){
			cffdelay(function(){
		    	cffCheckWidth();
		    	cffActionLinksPos();
		    	cffResizeAlbum();
		    }, 500);
		});

	});


	//Albums only

	//Resize image height
	function cffResizeAlbum(){
		var cffAlbumWidth = $('.cff-album-item').eq(0).find('a').innerWidth();
		$('.cff-album-item a').css('height', cffAlbumWidth);
	}
	cffResizeAlbum();


	//HTML5 Video play button
	$(document).on('click', '#cff .cff-html5-video .cff-html5-play', function(e){
		e.preventDefault();

		var $self = $(this),
			$videoWrapper = $self.closest('.cff-html5-video'),
			video = $self.siblings('video')[0];
		video.play();
		$self.hide();

		//Show controls when the play button is clicked
		if (video.hasAttribute("controls")) {
		    video.removeAttribute("controls")   
		} else {
		    video.setAttribute("controls","controls")   
		}

		if($videoWrapper.innerWidth() < 150 && !$videoWrapper.hasClass('cff-no-video-expand')) {
			$videoWrapper.css('width','100%').closest('.cff-item').find('.cff-text-wrapper').css('width','100%');
		}
	});



	//Cache the likes and comments counts by sending an array via ajax to the main plugin file which then stores it in a transient
	function cffCacheMeta(metaArr){
		//If the transient doesn't exist (set in head JS vars) then cache the data
		if(cffmetatrans == 'false'){
			var cffTimesCached = 0,
				cffCacheDelay = setTimeout(function() {
					var cffCacheInterval = setInterval(function(){
						
						//Send the data to DB via ajax every 3 seconds for 3 attempts
						$.ajax(opts);

						cffTimesCached++;
						if(cffTimesCached == 3) clearInterval(cffCacheInterval);
					}, 3000);

					//Send the data to DB initially via ajax after a 0.5 second delay
					$.ajax(opts);
				}, 500);
		}

	    opts = {
	        url: cffajaxurl,
	        type: 'POST',
	        async: true,
	        cache: false,
	        data:{
	            action: 'cache_meta', // Tell WordPress how to handle this ajax request
	            count: metaArr // Passes array of meta data to WP to cache

	            //set the cache time to be always 10 mins or use cache time from the db/shortcode?

	        },
	        success: function(response) {
	            return; 
	        },
	        error: function(xhr,textStatus,e) {  // This can be expanded to provide more information
	            return; 
	        }
	    };
	    
	}
	cffCacheMeta(metaArr);



})(jQuery);








/*!
imgLiquid v0.9.944 / 03-05-2013
https://github.com/karacas/imgLiquid
*/

var imgLiquid = imgLiquid || {VER: '0.9.944'};
imgLiquid.bgs_Available = false;
imgLiquid.bgs_CheckRunned = false;
imgLiquid.injectCss = '.cff-album-cover img {visibility:hidden}';


(function ($) {

	// ___________________________________________________________________

	function checkBgsIsavailable() {
		if (imgLiquid.bgs_CheckRunned) return;
		else imgLiquid.bgs_CheckRunned = true;

		var spanBgs = $('<span style="background-size:cover" />');
		$('body').append(spanBgs);

		!function () {
			var bgs_Check = spanBgs[0];
			if (!bgs_Check || !window.getComputedStyle) return;
			var compStyle = window.getComputedStyle(bgs_Check, null);
			if (!compStyle || !compStyle.backgroundSize) return;
			imgLiquid.bgs_Available = (compStyle.backgroundSize === 'cover');
		}();

		spanBgs.remove();
	}


	// ___________________________________________________________________

	$.fn.extend({
		imgLiquid: function (options) {

			this.defaults = {
				fill: true,
				verticalAlign: 'center',			//	'top'	//	'bottom' // '50%'  // '10%'
				horizontalAlign: 'center',			//	'left'	//	'right'  // '50%'  // '10%'
				useBackgroundSize: true,
				useDataHtmlAttr: true,

				responsive: true,					/* Only for use with BackgroundSize false (or old browsers) */
				delay: 0,							/* Only for use with BackgroundSize false (or old browsers) */
				fadeInTime: 0,						/* Only for use with BackgroundSize false (or old browsers) */
				removeBoxBackground: true,			/* Only for use with BackgroundSize false (or old browsers) */
				hardPixels: true,					/* Only for use with BackgroundSize false (or old browsers) */
				responsiveCheckTime: 500,			/* Only for use with BackgroundSize false (or old browsers) */ /* time to check div resize */
				timecheckvisibility: 500,			/* Only for use with BackgroundSize false (or old browsers) */ /* time to recheck if visible/loaded */

				// CALLBACKS
				onStart: null,						// no-params
				onFinish: null,						// no-params
				onItemStart: null,					// params: (index, container, img )
				onItemFinish: null,					// params: (index, container, img )
				onItemError: null					// params: (index, container, img )
			};


			checkBgsIsavailable();
			var imgLiquidRoot = this;

			// Extend global settings
			this.options = options;
			this.settings = $.extend({}, this.defaults, this.options);

			// CallBack
			if (this.settings.onStart) this.settings.onStart();


			// ___________________________________________________________________

			return this.each(function ($i) {

				// MAIN >> each for image

				var settings = imgLiquidRoot.settings,
				$imgBoxCont = $(this),
				$img = $('img:first',$imgBoxCont);
				if (!$img.length) {onError(); return;}


				// Extend settings
				if (!$img.data('imgLiquid_settings')) {
					// First time
					settings = $.extend({}, imgLiquidRoot.settings, getSettingsOverwrite());
				} else {
					// Recall
					// Remove Classes
					$imgBoxCont.removeClass('imgLiquid_error').removeClass('imgLiquid_ready');
					settings = $.extend({}, $img.data('imgLiquid_settings'), imgLiquidRoot.options);
				}
				$img.data('imgLiquid_settings', settings);


				// Start CallBack
				if (settings.onItemStart) settings.onItemStart($i, $imgBoxCont, $img); /* << CallBack */


				// Process
				if (imgLiquid.bgs_Available && settings.useBackgroundSize)
					processBgSize();
				else
					processOldMethod();


				// END MAIN <<

				// ___________________________________________________________________

				function processBgSize() {

					// Check change img src
					if ($imgBoxCont.css('background-image').indexOf(encodeURI($img.attr('src'))) === -1) {
						// Change
						$imgBoxCont.css({'background-image': 'url("' + encodeURI($img.attr('src')) + '")'});
					}

					$imgBoxCont.css({
						'background-size':		(settings.fill) ? 'cover' : 'contain',
						'background-position':	(settings.horizontalAlign + ' ' + settings.verticalAlign).toLowerCase(),
						'background-repeat':	'no-repeat'
					});

					$('a:first', $imgBoxCont).css({
						'display':	'block',
						'width':	'100%',
						'height':	'100%'
					});

					$('img', $imgBoxCont).css({'display': 'none'});

					if (settings.onItemFinish) settings.onItemFinish($i, $imgBoxCont, $img); /* << CallBack */

					$imgBoxCont.addClass('imgLiquid_bgSize');
					$imgBoxCont.addClass('imgLiquid_ready');
					checkFinish();
				}

				// ___________________________________________________________________

				function processOldMethod() {

					// Check change img src
					if ($img.data('oldSrc') && $img.data('oldSrc') !== $img.attr('src')) {

						/* Clone & Reset img */
						var $imgCopy = $img.clone().removeAttr('style');
						$imgCopy.data('imgLiquid_settings', $img.data('imgLiquid_settings'));
						$img.parent().prepend($imgCopy);
						$img.remove();
						$img = $imgCopy;
						$img[0].width = 0;

						// Bug ie with > if (!$img[0].complete && $img[0].width) onError();
						setTimeout(processOldMethod, 10);
						return;
					}


					// Reproceess?
					if ($img.data('imgLiquid_oldProcessed')) {
						makeOldProcess(); return;
					}


					// Set data
					$img.data('imgLiquid_oldProcessed', false);
					$img.data('oldSrc', $img.attr('src'));


					// Hide others images
					$('img:not(:first)', $imgBoxCont).css('display', 'none');


					// CSSs
					$imgBoxCont.css({'overflow': 'hidden'});
					$img.fadeTo(0, 0).removeAttr('width').removeAttr('height').css({
						'visibility': 'visible',
						'max-width': 'none',
						'max-height': 'none',
						'width': 'auto',
						'height': 'auto',
						'display': 'block'
					});


					// CheckErrors
					$img.on('error', onError);
					$img[0].onerror = onError;


					// loop until load
					function onLoad() {
						if ($img.data('imgLiquid_error') || $img.data('imgLiquid_loaded') || $img.data('imgLiquid_oldProcessed')) return;
						if ($imgBoxCont.is(':visible') && $img[0].complete && $img[0].width > 0 && $img[0].height > 0) {
							$img.data('imgLiquid_loaded', true);
							setTimeout(makeOldProcess, $i * settings.delay);
						} else {
							setTimeout(onLoad, settings.timecheckvisibility);
						}
					}


					onLoad();
					checkResponsive();
				}

				// ___________________________________________________________________

				function checkResponsive() {

					/* Only for oldProcessed method (background-size dont need) */

					if (!settings.responsive && !$img.data('imgLiquid_oldProcessed')) return;
					if (!$img.data('imgLiquid_settings')) return;

					settings = $img.data('imgLiquid_settings');

					$imgBoxCont.actualSize = $imgBoxCont.get(0).offsetWidth + ($imgBoxCont.get(0).offsetHeight / 10000);
					if ($imgBoxCont.sizeOld && $imgBoxCont.actualSize !== $imgBoxCont.sizeOld) makeOldProcess();

					$imgBoxCont.sizeOld = $imgBoxCont.actualSize;
					setTimeout(checkResponsive, settings.responsiveCheckTime);
				}

				// ___________________________________________________________________

				function onError() {
					$img.data('imgLiquid_error', true);
					$imgBoxCont.addClass('imgLiquid_error');
					if (settings.onItemError) settings.onItemError($i, $imgBoxCont, $img); /* << CallBack */
					checkFinish();
				}

				// ___________________________________________________________________

				function getSettingsOverwrite() {
					var SettingsOverwrite = {};

					if (imgLiquidRoot.settings.useDataHtmlAttr) {
						var dif = $imgBoxCont.attr('data-imgLiquid-fill'),
						ha =  $imgBoxCont.attr('data-imgLiquid-horizontalAlign'),
						va =  $imgBoxCont.attr('data-imgLiquid-verticalAlign');

						if (dif === 'true' || dif === 'false') SettingsOverwrite.fill = Boolean (dif === 'true');
						if (ha !== undefined && (ha === 'left' || ha === 'center' || ha === 'right' || ha.indexOf('%') !== -1)) SettingsOverwrite.horizontalAlign = ha;
						if (va !== undefined && (va === 'top' ||  va === 'bottom' || va === 'center' || va.indexOf('%') !== -1)) SettingsOverwrite.verticalAlign = va;
					}

					if (imgLiquid.isIE && imgLiquidRoot.settings.ieFadeInDisabled) SettingsOverwrite.fadeInTime = 0; //ie no anims
					return SettingsOverwrite;
				}

				// ___________________________________________________________________

				function makeOldProcess() { /* Only for old browsers, or useBackgroundSize seted false */

					// Calculate size
					var w, h, wn, hn, ha, va, hdif, vdif,
					margT = 0,
					margL = 0,
					$imgCW = $imgBoxCont.width(),
					$imgCH = $imgBoxCont.height();


					// Save original sizes
					if ($img.data('owidth')	=== undefined) $img.data('owidth',	$img[0].width);
					if ($img.data('oheight') === undefined) $img.data('oheight', $img[0].height);


					// Compare ratio
					if (settings.fill === ($imgCW / $imgCH) >= ($img.data('owidth') / $img.data('oheight'))) {
						w = '100%';
						h = 'auto';
						wn = Math.floor($imgCW);
						hn = Math.floor($imgCW * ($img.data('oheight') / $img.data('owidth')));
					} else {
						w = 'auto';
						h = '100%';
						wn = Math.floor($imgCH * ($img.data('owidth') / $img.data('oheight')));
						hn = Math.floor($imgCH);
					}

					// Align X
					ha = settings.horizontalAlign.toLowerCase();
					hdif = $imgCW - wn;
					if (ha === 'left') margL = 0;
					if (ha === 'center') margL = hdif * 0.5;
					if (ha === 'right') margL = hdif;
					if (ha.indexOf('%') !== -1){
						ha = parseInt (ha.replace('%',''), 10);
						if (ha > 0) margL = hdif * ha * 0.01;
					}


					// Align Y
					va = settings.verticalAlign.toLowerCase();
					vdif = $imgCH - hn;
					if (va === 'left') margT = 0;
					if (va === 'center') margT = vdif * 0.5;
					if (va === 'bottom') margT = vdif;
					if (va.indexOf('%') !== -1){
						va = parseInt (va.replace('%',''), 10);
						if (va > 0) margT = vdif * va * 0.01;
					}


					// Add Css
					if (settings.hardPixels) {w = wn; h = hn;}
					$img.css({
						'width': w,
						'height': h,
						'margin-left': Math.floor(margL),
						'margin-top': Math.floor(margT)
					});


					// FadeIn > Only first time
					if (!$img.data('imgLiquid_oldProcessed')) {
						$img.fadeTo(settings.fadeInTime, 1);
						$img.data('imgLiquid_oldProcessed', true);
						if (settings.removeBoxBackground) $imgBoxCont.css('background-image', 'none');
						$imgBoxCont.addClass('imgLiquid_nobgSize');
						$imgBoxCont.addClass('imgLiquid_ready');
					}


					if (settings.onItemFinish) settings.onItemFinish($i, $imgBoxCont, $img); /* << CallBack */
					checkFinish();
				}

				// ___________________________________________________________________

				function checkFinish() { /* Check callBack */
					if ($i === imgLiquidRoot.length - 1) if (imgLiquidRoot.settings.onFinish) imgLiquidRoot.settings.onFinish();
				}


			});
		}
	});
})(jQuery);


// Inject css styles ______________________________________________________
!function () {
	var css = imgLiquid.injectCss,
	head = document.getElementsByTagName('head')[0],
	style = document.createElement('style');
	style.type = 'text/css';
	if (style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		style.appendChild(document.createTextNode(css));
	}
	head.appendChild(style);
}();
jQuery(".cff-album-cover").imgLiquid({fill:true});





function cffLightbox(){
	/**
	 * Lightbox v2.7.1
	 * by Lokesh Dhakar - http://lokeshdhakar.com/projects/lightbox2/
	 *
	 * @license http://creativecommons.org/licenses/by/2.5/
	 * - Free for use in both personal and commercial projects
	 * - Attribution requires leaving author name, author link, and the license info intact
	 */

	(function() {
	  // Use local alias
	  var $ = jQuery;

	  var LightboxOptions = (function() {
	    function LightboxOptions() {
	      this.fadeDuration                = 300;
	      this.fitImagesInViewport         = true;
	      this.resizeDuration              = 400;
	      this.positionFromTop             = 50;
	      this.showImageNumberLabel        = true;
	      this.alwaysShowNavOnTouchDevices = false;
	      this.wrapAround                  = false;
	    }
	    
	    // Change to localize to non-english language
	    LightboxOptions.prototype.albumLabel = function(curImageNum, albumSize) {
	      return curImageNum + " / " + albumSize;
	    };

	    return LightboxOptions;
	  })();


	  var Lightbox = (function() {
	    function Lightbox(options) {
	      this.options           = options;
	      this.album             = [];
	      this.currentImageIndex = void 0;
	      this.init();
	    }

	    Lightbox.prototype.init = function() {
	      this.enable();
	      this.build();
	    };

	    // Loop through anchors and areamaps looking for either data-lightbox attributes or rel attributes
	    // that contain 'lightbox'. When these are clicked, start lightbox.
	    Lightbox.prototype.enable = function() {
	      var self = this;
	      $('body').on('click', 'a[rel^=lightbox], area[rel^=lightbox], a[data-cff-lightbox], area[data-cff-lightbox]', function(event) {
	        self.start($(event.currentTarget));
	        return false;
	      });
	    };

	    // Build html for the lightbox and the overlay.
	    // Attach event handlers to the new DOM elements. click click click
	    Lightbox.prototype.build = function() {
	      var self = this;
	      $("<div id='cff-lightbox-overlay' class='cff-lightbox-overlay'></div><div id='cff-lightbox-wrapper' class='cff-lightbox-wrapper'><div class='cff-lightbox-outerContainer'><div class='cff-lightbox-container'><video class='cff-lightbox-video' src='' poster='' controls></video><iframe type='text/html' src='' allowfullscreen frameborder='0' webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe><img class='cff-lightbox-image' src='' /><div class='cff-lightbox-nav'><a class='cff-lightbox-prev' href=''></a><a class='cff-lightbox-next' href=''></a></div><div class='cff-lightbox-loader'><a class='cff-lightbox-cancel'></a></div></div></div><div class='cff-lightbox-dataContainer'><div class='cff-lightbox-data'><div class='cff-lightbox-details'><p class='cff-lightbox-caption'><span class='cff-lightbox-caption-text'></span><a class='cff-lightbox-facebook' href=''>"+$('#cff').attr('data-fb-text')+"</a></p><div class='cff-lightbox-thumbs'><div class='cff-lightbox-thumbs-holder'></div></div></div><div class='cff-lightbox-closeContainer'><a class='cff-lightbox-close'><i class='fa fa-times'></i></a></div></div></div></div>").appendTo($('body'));
	      
	      // Cache jQuery objects
	      this.$lightbox       = $('#cff-lightbox-wrapper');
	      this.$overlay        = $('#cff-lightbox-overlay');
	      this.$outerContainer = this.$lightbox.find('.cff-lightbox-outerContainer');
	      this.$container      = this.$lightbox.find('.cff-lightbox-container');

	      // Store css values for future lookup
	      this.containerTopPadding = parseInt(this.$container.css('padding-top'), 10);
	      this.containerRightPadding = parseInt(this.$container.css('padding-right'), 10);
	      this.containerBottomPadding = parseInt(this.$container.css('padding-bottom'), 10);
	      this.containerLeftPadding = parseInt(this.$container.css('padding-left'), 10);
	      
	      // Attach event handlers to the newly minted DOM elements
	      this.$overlay.hide().on('click', function() {
	        self.end();
	        if( cff_supports_video() ) $('#cff-lightbox-wrapper .cff-lightbox-video')[0].pause();
	        $('#cff-lightbox-wrapper iframe').attr('src', '');
	        return false;
	      });


	      this.$lightbox.hide().on('click', function(event) {
	        if ($(event.target).attr('id') === 'cff-lightbox-wrapper') {
	          self.end();
		        if( cff_supports_video() ) $('#cff-lightbox-wrapper .cff-lightbox-video')[0].pause();
		        $('#cff-lightbox-wrapper iframe').attr('src', '');
	        }
	        return false;
	      });
	      this.$outerContainer.on('click', function(event) {
	        if ($(event.target).attr('id') === 'cff-lightbox-wrapper') {
	          self.end();
	          if( cff_supports_video() ) $('#cff-lightbox-wrapper .cff-lightbox-video')[0].pause();
	        	$('#cff-lightbox-wrapper iframe').attr('src', '');
	        }
	        return false;
	      });


	      this.$lightbox.find('.cff-lightbox-prev').on('click', function() {
	        if (self.currentImageIndex === 0) {
	          self.changeImage(self.album.length - 1);
	        } else {
	          self.changeImage(self.currentImageIndex - 1);
	        }
	        if( cff_supports_video() ) $('#cff-lightbox-wrapper .cff-lightbox-video')[0].pause();
	        $('#cff-lightbox-wrapper iframe').attr('src', '');
	        return false;
	      });

	      this.$lightbox.find('.cff-lightbox-next').on('click', function() {
	        if (self.currentImageIndex === self.album.length - 1) {
	          self.changeImage(0);
	        } else {
	          self.changeImage(self.currentImageIndex + 1);
	        }
	        if( cff_supports_video() ) $('#cff-lightbox-wrapper .cff-lightbox-video')[0].pause();
	        $('#cff-lightbox-wrapper iframe').attr('src', '');
	        return false;
	      });


	      //CHANGE IMAGE ON THUMB CLICK
	      $('.cff-lightbox-thumbs').on('click', '.cff-lightbox-attachment', function (){
	      	var $thumb = $(this),
	      		$thumbImg = $thumb.find('img'),
				captionText = $thumb.attr('data-caption');

			if(captionText == '' || captionText == 'undefined') captionText = $thumb.attr('orig-caption');

	      	//Pass image URL, width and height to the change image function
	      	//We don't know the imageNumber here so pass in 'same' so that it stays the same
	        self.changeImage('same', $thumb.attr('href'), $thumbImg.attr('width'), $thumbImg.attr('height'), $thumb.attr('data-facebook'), captionText);
	        return false;
	      });


	      this.$lightbox.find('.cff-lightbox-loader, .cff-lightbox-close').on('click', function() {
	        self.end();
	        if( cff_supports_video() ) $('#cff-lightbox-wrapper .cff-lightbox-video')[0].pause();
	        $('#cff-lightbox-wrapper iframe').attr('src', '');
	        return false;
	      });
	    };

	    // Show overlay and lightbox. If the image is part of a set, add siblings to album array.
	    Lightbox.prototype.start = function($link) {
	      var self    = this;
	      var $window = $(window);

	      $window.on('resize', $.proxy(this.sizeOverlay, this));

	      $('select, object, embed').css({
	        visibility: "hidden"
	      });

	      this.sizeOverlay();

	      this.album = [];
	      var imageNumber = 0;

	      function addToAlbum($link) {
	        self.album.push({
	          link: $link.attr('href'),
	          title: $link.attr('data-title') || $link.attr('title'),
	          postid: $link.attr('data-id'),
	          showthumbs: $link.attr('data-thumbs'),
	          facebookurl: $link.attr('data-url'),
	          video: $link.attr('data-video'),
	          iframe: $link.attr('data-iframe'),
	          type: $link.attr('data-type'),
	        });
	      }

	      // Support both data-lightbox attribute and rel attribute implementations
	      var dataLightboxValue = $link.attr('data-cff-lightbox');
	      var $links;

	      if (dataLightboxValue) {
	        $links = $($link.prop("tagName") + '[data-cff-lightbox="' + dataLightboxValue + '"]');
	        for (var i = 0; i < $links.length; i = ++i) {
	          addToAlbum($($links[i]));
	          if ($links[i] === $link[0]) {
	            imageNumber = i;
	          }
	        }
	      } else {
	        if ($link.attr('rel') === 'lightbox') {
	          // If image is not part of a set
	          addToAlbum($link);
	        } else {
	          // If image is part of a set
	          $links = $($link.prop("tagName") + '[rel="' + $link.attr('rel') + '"]');
	          for (var j = 0; j < $links.length; j = ++j) {
	            addToAlbum($($links[j]));
	            if ($links[j] === $link[0]) {
	              imageNumber = j;
	            }
	          }
	        }
	      }
	      
	      // Position Lightbox
	      var top  = $window.scrollTop() + this.options.positionFromTop;
	      var left = $window.scrollLeft();
	      this.$lightbox.css({
	        top: top + 'px',
	        left: left + 'px'
	      }).fadeIn(this.options.fadeDuration);

	      this.changeImage(imageNumber);
	    };

	    // Hide most UI elements in preparation for the animated resizing of the lightbox.
	    Lightbox.prototype.changeImage = function(imageNumberVal, imageUrl, imgWidth, imgHeight, facebookLink, captionText) {
	      var self = this,
	      	isThumb = false,
	      	bottomPadding = 120;

	      	if(imageNumberVal == 'same'){
	      		imageNumber = imageNumber;
	      	} else {
	      		imageNumber = imageNumberVal;
	      	}

	      //Is this a thumb being clicked?
	      if(typeof imageUrl !== 'undefined') isThumb = true;

	      this.disableKeyboardNav();
	      var $image = this.$lightbox.find('.cff-lightbox-image');

	      this.$overlay.fadeIn(this.options.fadeDuration);

	      $('.cff-lightbox-loader').fadeIn('slow');
	      this.$lightbox.find('.cff-lightbox-image, .cff-lightbox-nav, .cff-lightbox-prev, .cff-lightbox-next, .cff-lightbox-dataContainer, .cff-lightbox-numbers, .cff-lightbox-caption').hide();

	      this.$outerContainer.addClass('animating');


	      // When image to show is preloaded, we send the width and height to sizeContainer()
	      var preloader = new Image();
	      preloader.onload = function() {
	        var $preloader, imageHeight, imageWidth, maxImageHeight, maxImageWidth, windowHeight, windowWidth;
	        
	        $image.attr('src', self.album[imageNumber].link);

	        /*** THUMBS ***/
	        //Change the main image when the thumb is clicked
	        if(isThumb){
	        	$image.attr('src', imageUrl);
	        	$('.cff-lightbox-facebook').attr('href', facebookLink);
	        	$('.cff-lightbox-caption .cff-lightbox-caption-text').html(captionText);

	        	//Set width and height of image when thumb is clicked
	        	preloader.width = imgWidth;
	        	preloader.height = imgHeight;

	        	//Increase bottom padding to make room for at least one row of thumbs
	        	bottomPadding = 180;
	        }
	        /*** THUMBS ***/

	        $preloader = $(preloader);

	        $image.width(preloader.width);
	        $image.height(preloader.height);
	        
	        if (self.options.fitImagesInViewport) {
	          // Fit image inside the viewport.
	          // Take into account the border around the image and an additional 10px gutter on each side.

	          windowWidth    = $(window).width();
	          windowHeight   = $(window).height();
	          maxImageWidth  = windowWidth - self.containerLeftPadding - self.containerRightPadding - 20;
	          maxImageHeight = windowHeight - self.containerTopPadding - self.containerBottomPadding - bottomPadding;

	          // Is there a fitting issue?
	          if ((preloader.width > maxImageWidth) || (preloader.height > maxImageHeight)) {
	            if ((preloader.width / maxImageWidth) > (preloader.height / maxImageHeight)) {
	              imageWidth  = maxImageWidth;
	              imageHeight = parseInt(preloader.height / (preloader.width / imageWidth), 10);
	              $image.width(imageWidth);
	              $image.height(imageHeight);
	            } else {
	              imageHeight = maxImageHeight;
	              imageWidth = parseInt(preloader.width / (preloader.height / imageHeight), 10);
	              $image.width(imageWidth);
	              $image.height(imageHeight);
	            }
	          }
	        }

	        //Pass the width and height of the main image
	        self.sizeContainer($image.width(), $image.height());

	      };

	      preloader.src          = this.album[imageNumber].link;
	      this.currentImageIndex = imageNumber;
	    };

	    // Stretch overlay to fit the viewport
	    Lightbox.prototype.sizeOverlay = function() {
	      this.$overlay
	        .width($(window).width())
	        .height($(document).height());
	    };

	    // Animate the size of the lightbox to fit the image we are showing
	    Lightbox.prototype.sizeContainer = function(imageWidth, imageHeight) {
	      var self = this;
	      
	      var oldWidth  = this.$outerContainer.outerWidth();
	      var oldHeight = this.$outerContainer.outerHeight();
	      var newWidth  = imageWidth + this.containerLeftPadding + this.containerRightPadding;
	      var newHeight = imageHeight + this.containerTopPadding + this.containerBottomPadding;
	      
	      function postResize() {
	        self.$lightbox.find('.cff-lightbox-dataContainer').width(newWidth);
	        self.$lightbox.find('.cff-lightbox-prevLink').height(newHeight);
	        self.$lightbox.find('.cff-lightbox-nextLink').height(newHeight);
	        self.showImage();
	      }

	      if (oldWidth !== newWidth || oldHeight !== newHeight) {
	        this.$outerContainer.animate({
	          width: newWidth,
	          height: newHeight
	        }, this.options.resizeDuration, 'swing', function() {
	          postResize();
	        });
	      } else {
	        postResize();
	      }
	    };

	    // Display the image and it's details and begin preload neighboring images.
	    Lightbox.prototype.showImage = function() {
	      this.$lightbox.find('.cff-lightbox-loader').hide();
	      this.$lightbox.find('.cff-lightbox-image').fadeIn('slow');
	    
	      this.updateNav();
	      this.updateDetails();
	      this.preloadNeighboringImages();
	      this.enableKeyboardNav();
	    };

	    // Display previous and next navigation if appropriate.
	    Lightbox.prototype.updateNav = function() {
	      // Check to see if the browser supports touch events. If so, we take the conservative approach
	      // and assume that mouse hover events are not supported and always show prev/next navigation
	      // arrows in image sets.
	      var alwaysShowNav = false;
	      try {
	        document.createEvent("TouchEvent");
	        alwaysShowNav = (this.options.alwaysShowNavOnTouchDevices)? true: false;
	      } catch (e) {}

	      this.$lightbox.find('.cff-lightbox-nav').show();

	      if (this.album.length > 1) {
	        if (this.options.wrapAround) {
	          if (alwaysShowNav) {
	            this.$lightbox.find('.cff-lightbox-prev, .cff-lightbox-next').css('opacity', '1');
	          }
	          this.$lightbox.find('.cff-lightbox-prev, .cff-lightbox-next').show();
	        } else {
	          if (this.currentImageIndex > 0) {
	            this.$lightbox.find('.cff-lightbox-prev').show();
	            if (alwaysShowNav) {
	              this.$lightbox.find('.cff-lightbox-prev').css('opacity', '1');
	            }
	          }
	          if (this.currentImageIndex < this.album.length - 1) {
	            this.$lightbox.find('.cff-lightbox-next').show();
	            if (alwaysShowNav) {
	              this.$lightbox.find('.cff-lightbox-next').css('opacity', '1');
	            }
	          }
	        }
	      }
	    };

	    var thumbsArr = {};

	    // Display caption, image number, and closing button.
	    Lightbox.prototype.updateDetails = function() {
	    	var self = this;
	    	var origCaption = '';

	    	this.$lightbox.find('.cff-lightbox-nav, .cff-lightbox-nav a').show();

	      	/** NEW PHOTO ACTION **/
	      	//Switch video when either a new popup or navigating to new one
            if( cff_supports_video() ){
                $('#cff-lightbox-wrapper').removeClass('cff-has-video');
                if( this.album[this.currentImageIndex].video.length ){
                	$('#cff-lightbox-wrapper').addClass('cff-has-video');
	                $('.cff-lightbox-video').attr({
	                	'src' : this.album[this.currentImageIndex].video,
	                	'poster' : this.album[this.currentImageIndex].link,
	                	'autoplay' : 'true'
	                });
	            }
	        }

            $('#cff-lightbox-wrapper').removeClass('cff-has-iframe');
	        if( this.album[this.currentImageIndex].iframe.length ){
	        	var videoURL = this.album[this.currentImageIndex].iframe;
            	$('#cff-lightbox-wrapper').addClass('cff-has-iframe');

            	//If it's a swf then don't add the autoplay parameter. This is only for embedded videos like YouTube or Vimeo.
            	if( videoURL.indexOf(".swf") > -1 ){
            		var autoplayParam = '';
            	} else {
            		var autoplayParam = '?autoplay=1';
            	}

            	//Add a slight delay before adding the URL else it doesn't autoplay on Firefox
	            var vInt = setTimeout(function() {
					$('#cff-lightbox-wrapper iframe').attr({
	                	'src' : videoURL + autoplayParam
	                });
				}, 500);
            }


	      	//Remove existing thumbs
	      	$('.cff-lightbox-thumbs-holder').empty();

	      	//Change the link on the Facebook icon to be the link to the Facebook post only if it's the first image in the lightbox and one of the thumbs hasn't been clicked
	      	if( this.album[this.currentImageIndex].link == $('.cff-lightbox-image').attr('src') ){
	      		$('.cff-lightbox-facebook').attr('href', this.album[this.currentImageIndex].facebookurl);
	      	}

	      	//Show thumbs area if there are thumbs
	     	if( this.album[this.currentImageIndex].showthumbs == 'true' ){
	      		$('.cff-lightbox-thumbs').show();
	      		// $('.cff-lightbox-thumbs .cff-loader').show();

	      		//Get the post ID
	      		var thisPostId = this.album[this.currentImageIndex].postid,
	      			albumInfo = '',
			      	albumThumbs = '';


		      	if( typeof thumbsArr[thisPostId] !== 'undefined' ){

		      		//load them in from array
		      		$.each(thumbsArr[thisPostId], function(i, thumb) {
		      		  var origCaption = thumb[5].replace(/"/g, '&quot;');
					  albumThumbs += '<a href="'+thumb[0]+'" class="cff-lightbox-attachment" data-facebook="'+thumb[3]+'" data-caption="'+thumb[4]+'" orig-caption="'+origCaption+'"><img src="'+thumb[0]+'" width="'+thumb[1]+'" height="'+thumb[2]+'" /></a>';
					});

		      		//Add thumbs to the page
	            	$('.cff-lightbox-thumbs-holder').append( '<div style="margin-top: 10px;">' + albumThumbs + '</div>' );

	            	//Liquidfill the thumbs
	            	jQuery(".cff-lightbox-thumbs-holder a").imgLiquid({fill:true});

	            	//Hide the loader
	            	$('.cff-loader').hide();
					$('.cff-lightbox-thumbs-holder').css('min-height', 0);

		      	} else {
		      		//Use ajax to get them from Facebook API

		      		//Set paths for thumbs.php
				  	if (typeof cffsiteurl === 'undefined' || cffsiteurl == '') cffsiteurl = window.location.host + '/wp-content/plugins';

				  	//AJAX
				  	var cffAttachmentsUrl = cffsiteurl + "/custom-facebook-feed-pro/thumbs.php?id=" + thisPostId,
			      		thumbsData = [],
			      		albumsonly = false;

			      	//If this is an albums only item and the thumbs will
			      	if( this.album[this.currentImageIndex].type == 'albumsonly' ){
			      		albumsonly = true;
			      		cffAttachmentsUrl = cffAttachmentsUrl + '&albumsonly=true';
			      		$('.cff-lightbox-thumbs-holder').css('min-height', 45).after('<div class="cff-loader fa-spin"></div>');
			      	}

			      	$.ajax({
		            method: "GET",
		            url: cffAttachmentsUrl,
		            // dataType: "jsonp",
		            success: function(data) {
		            	// albumInfo = '<h4>' + data.attachments.data[0].title + '</h4>';
		            	// albumInfo += '<p><a href="' + data.attachments.data[0].url + '" target="_blank">View album</a></p>';

		            	//Convert string of data received from thumbs.php to a JSON object
		            	data = jQuery.parseJSON( data );

		            	if(albumsonly){
		            		//Compile the thumbs
				      		$.each(data.data, function(i, photoItem) {
				      		  var dataCaption = '';
				      		  if( photoItem.name ) dataCaption = photoItem.name;
				      		  // origCaption = String(origCaption).replace(/"/g, '&quot;');
							  albumThumbs += '<a href="'+photoItem.source+'" class="cff-lightbox-attachment" data-facebook="http://facebook.com/'+photoItem.id+'" data-caption="'+dataCaption+'" orig-caption="'+origCaption+'"><img src="'+photoItem.source+'" width="'+photoItem.width+'" height="'+photoItem.height+'" /></a>';

							  thumbsData.push([photoItem.source, photoItem.width, photoItem.height, 'http://facebook.com/'+photoItem.id, dataCaption, origCaption]);
							});
		            	} else {
		            		//Compile the thumbs
	            			$.each(data.attachments.data[0].subattachments.data, function(i, subattachment) {
	            			  var dataCaption = '';
				      		  if( subattachment.description ) dataCaption = subattachment.description;
				      		  origCaption = String(origCaption).replace(/"/g, '&quot;');

							  albumThumbs += '<a href="'+subattachment.media.image.src+'" class="cff-lightbox-attachment" data-facebook="'+subattachment.url+'" data-caption="'+dataCaption+'" orig-caption="'+origCaption+'"><img src="'+subattachment.media.image.src+'" width="'+subattachment.media.image.width+'" height="'+subattachment.media.image.height+'" /></a>';

							  thumbsData.push([subattachment.media.image.src, subattachment.media.image.width, subattachment.media.image.height, subattachment.url, dataCaption, origCaption]);
							});
				      		
		            	}

						//Add thumbs to the page
		            	$('.cff-lightbox-thumbs-holder').append( '<div style="margin-top: 10px;">' + albumThumbs + '</div>' );

		            	//Liquidfill the thumbs
		            	jQuery(".cff-lightbox-thumbs-holder .cff-lightbox-attachment").imgLiquid({fill:true});

		            	//Hide the loader
		            	$('.cff-loader').hide();
						$('.cff-lightbox-thumbs-holder').css('min-height', 0);

		            	//Add the thumbs to the thumbs array to store them
		            	thumbsArr[ thisPostId ] = thumbsData;

		            	//Add a 'See More' link to thumbs which are more than 12. Use custom "See More" text for the link. Add an option to load more thumbs instead?
		            	// if( $('.cff-lightbox-attachment').length == 12 ) $('.cff-lightbox-thumbs-holder').append('<p><a href="https://facebook.com/'+data.id+'" style="width: 100%; height: auto;"">See More</a></p>');

			          }
			        });

		      	}


	      	} else {
	      		//If there are no thumbs then hide the thumbs area
	      		$('.cff-lightbox-thumbs').hide();
	      	}


	      /** END NEW PHOTO ACTION **/

	      // Enable anchor clicks in the injected caption html.
	      // Thanks Nate Wright for the fix. @https://github.com/NateWr
	      if (typeof this.album[this.currentImageIndex].title !== 'undefined' && this.album[this.currentImageIndex].title !== "") {
	        
	      	//If it's the first image in the lightbox then set the caption to be the text from the post. For all subsequent images the caption is changed on the fly based elsehwere in the code based on an attr from the thumb that's clicked
	      	var origCaption = this.album[this.currentImageIndex].title;

	      	if( this.album[this.currentImageIndex].link == $('.cff-lightbox-image').attr('src') ) this.$lightbox.find('.cff-lightbox-caption .cff-lightbox-caption-text').html( origCaption );

	        this.$lightbox.find('.cff-lightbox-caption').fadeIn('fast');
	        this.$lightbox.find('.cff-lightbox-facebook').unbind().on('click', function(event){
	            window.open(
	            	$(this).attr('href'),
	            	'_blank'
	            )
	          });
	      }

	    
	      if (this.album.length > 1 && this.options.showImageNumberLabel) {
	        this.$lightbox.find('.cff-lightbox-number').text(this.options.albumLabel(this.currentImageIndex + 1, this.album.length)).fadeIn('fast');
	      } else {
	        this.$lightbox.find('.cff-lightbox-number').hide();
	      }
	    
	      this.$outerContainer.removeClass('animating');
	    
	      this.$lightbox.find('.cff-lightbox-dataContainer').fadeIn(this.options.resizeDuration, function() {
	        return self.sizeOverlay();
	      });
	    };

	    // Preload previous and next images in set.
	    Lightbox.prototype.preloadNeighboringImages = function() {
	      if (this.album.length > this.currentImageIndex + 1) {
	        var preloadNext = new Image();
	        preloadNext.src = this.album[this.currentImageIndex + 1].link;
	      }
	      if (this.currentImageIndex > 0) {
	        var preloadPrev = new Image();
	        preloadPrev.src = this.album[this.currentImageIndex - 1].link;
	      }
	    };

	    Lightbox.prototype.enableKeyboardNav = function() {
	      $(document).on('keyup.keyboard', $.proxy(this.keyboardAction, this));
	    };

	    Lightbox.prototype.disableKeyboardNav = function() {
	      $(document).off('.keyboard');
	    };

	    Lightbox.prototype.keyboardAction = function(event) {
	      var KEYCODE_ESC        = 27;
	      var KEYCODE_LEFTARROW  = 37;
	      var KEYCODE_RIGHTARROW = 39;

	      var keycode = event.keyCode;
	      var key     = String.fromCharCode(keycode).toLowerCase();
	      if (keycode === KEYCODE_ESC || key.match(/x|o|c/)) {
	        this.end();
	      } else if (key === 'p' || keycode === KEYCODE_LEFTARROW) {
	        if (this.currentImageIndex !== 0) {
	          this.changeImage(this.currentImageIndex - 1);
	        } else if (this.options.wrapAround && this.album.length > 1) {
	          this.changeImage(this.album.length - 1);
	        }
	      } else if (key === 'n' || keycode === KEYCODE_RIGHTARROW) {
	        if (this.currentImageIndex !== this.album.length - 1) {
	          this.changeImage(this.currentImageIndex + 1);
	        } else if (this.options.wrapAround && this.album.length > 1) {
	          this.changeImage(0);
	        }
	      }
	    };

	    // Closing time. :-(
	    Lightbox.prototype.end = function() {
	      this.disableKeyboardNav();
	      $(window).off("resize", this.sizeOverlay);
	      this.$lightbox.fadeOut(this.options.fadeDuration);
	      this.$overlay.fadeOut(this.options.fadeDuration);
	      $('select, object, embed').css({
	        visibility: "visible"
	      });
	    };

	    return Lightbox;

	  })();

	  $(function() {
	    var options  = new LightboxOptions();
	    var lightbox = new Lightbox(options);
	  });

	}).call(this);

	//Checks whether browser support HTML5 video element
	function cff_supports_video() {
	  return !!document.createElement('video').canPlayType;
	}


} //End cffLightbox function

//Only call the lightbox if the class is on at least one feed on the page
if( jQuery('#cff.cff-lb').length ) cffLightbox();