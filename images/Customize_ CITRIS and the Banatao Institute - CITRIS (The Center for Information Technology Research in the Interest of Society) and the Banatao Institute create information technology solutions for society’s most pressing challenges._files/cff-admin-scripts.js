jQuery(document).ready(function($) {
	
	//Tooltips
	jQuery('#cff-admin .cff-tooltip-link').click(function(){
		jQuery(this).closest('tr, h3').find('.cff-tooltip').slideToggle();
	});

	//Toggle Access Token field
	if( jQuery('#cff_show_access_token').is(':checked') ) jQuery('.cff-access-token-hidden').show();
	jQuery('#cff_show_access_token').change(function(){
		jQuery('.cff-access-token-hidden').fadeToggle();
	});

	//Check Access Token length
	jQuery("#cff_access_token").change(function() {

		var cff_token_string = jQuery('#cff_access_token').val(),
			cff_token_check = cff_token_string.indexOf('|');

  		if ( (cff_token_check == -1) && (cff_token_string.length < 50) && (cff_token_string.length !== 0) ) {
  			jQuery('.cff-profile-error.cff-access-token').fadeIn();
  		} else {
  			jQuery('.cff-profile-error.cff-access-token').fadeOut();
  		}

	});

	//Is this a page, group or profile?
	var cff_page_type = jQuery('.cff-page-type select').val(),
		$cff_page_type_options = jQuery('.cff-page-options'),
		$cff_profile_error = jQuery('.cff-profile-error.cff-page-type');

	//Should we show anything initially?
	if(cff_page_type !== 'page') $cff_page_type_options.hide();
	if(cff_page_type == 'profile') $cff_profile_error.show();

	//When page type is changed show the relevant item
	jQuery('.cff-page-type').change(function(){
		cff_page_type = jQuery('.cff-page-type select').val();

		if( cff_page_type !== 'page' ) {
			$cff_page_type_options.fadeOut(function(){
				if( cff_page_type == 'profile' ) {
					$cff_profile_error.fadeIn();
				} else {
					$cff_profile_error.fadeOut();
				}
			});
			
		} else {
			$cff_page_type_options.fadeIn();
			$cff_profile_error.fadeOut();
		}
	});

	//PHOTOS ONLY
	//When 'Display photos from your Photos page' is checked then show the options
	var cff_photo_source = jQuery('#cff_photos_source select').val();

	//Should we show anything initially?
	if(cff_photo_source == 'timeline') jQuery('.cff-photo-source-options').hide();

	jQuery('#cff_photos_source select').change(function(){
		cff_photo_source = jQuery(this).val();

		if( cff_photo_source == 'photospage' ) {
			jQuery('.cff-photo-source-options').slideDown();
		} else {
			jQuery('.cff-photo-source-options').slideUp();
		}
	});

	//ALBUMS ONLY
	//When 'Dispay albums from your Photos page' is checked then show the options
	var cff_album_source = jQuery('#cff_albums_source select').val();

	//Should we show anything initially?
	if(cff_album_source == 'timeline') jQuery('.cff-album-source-options').hide();

	jQuery('#cff_albums_source select').change(function(){
		cff_album_source = jQuery(this).val();

		if( cff_album_source == 'photospage' ) {
			jQuery('.cff-album-source-options').slideDown();
		} else {
			jQuery('.cff-album-source-options').slideUp();
		}
	});

	//VIDEOS ONLY
	//When 'Dispay videos from your Videos page' is checked then show the options
	var cff_video_source = jQuery('#cff_videos_source select').val();

	//Should we show anything initially?
	if(cff_video_source == 'timeline') jQuery('.cff-video-source-options').hide();

	jQuery('#cff_videos_source select').change(function(){
		cff_video_source = jQuery(this).val();

		if( cff_video_source == 'videospage' ) {
			jQuery('.cff-video-source-options').slideDown();
		} else {
			jQuery('.cff-video-source-options').slideUp();
		}
	});


	//Show narrow option when Full-width layout is selected
	function toggleMediaOptions(){
		if( $('.cff-full').hasClass('cff-layout-selected') ){
			$('.cff-media-position').fadeIn();
		} else {
			$('.cff-media-position').fadeOut();
		}
	}
	toggleMediaOptions();



	//Choose events source
	var $cff_events_only_options = jQuery('.cff-events-only-options'),
		checked = jQuery("#post-types input.cff-post-type:checkbox:checked");
	
	//Hide page source option initially
	$cff_events_only_options.hide();

	//Show if only events are checked
	if (checked.length === 1 && checked[0].id === 'cff_show_event_type') {
		$cff_events_only_options.slideDown();
	}


	//Albums only
	var $cff_albums_only_options = jQuery('.cff-albums-only-options');
	
	//Hide page source option initially
	$cff_albums_only_options.hide();

	//Show if only events are checked
	if (checked.length === 1 && checked[0].id === 'cff_show_albums_type') {
		$cff_albums_only_options.slideDown();
	}


	//Photos only
	var $cff_photos_only_options = jQuery('.cff-photos-only-options');
	
	//Hide page source option initially
	$cff_photos_only_options.hide();

	//Show if only events are checked
	if (checked.length === 1 && checked[0].id === 'cff_show_photos_type') {
		$cff_photos_only_options.slideDown();
	}


	//Videos only
	var $cff_videos_only_options = jQuery('.cff-videos-only-options');
	
	//Hide page source option initially
	$cff_videos_only_options.hide();

	//Show if only videos are checked
	if (checked.length === 1 && checked[0].id === 'cff_show_video_type') {
		$cff_videos_only_options.slideDown();
	}


	//On change check which post type is checked
	jQuery("#post-types").change(function() {
		var checked = jQuery("#post-types input.cff-post-type:checkbox:checked");

		if (checked.length === 1 && checked[0].id === 'cff_show_event_type') {
	        $cff_events_only_options.slideDown();
	    } else if (checked.length === 1 && checked[0].id === 'cff_show_albums_type') {
	        $cff_albums_only_options.slideDown();
	    } else if (checked.length === 1 && checked[0].id === 'cff_show_photos_type') {
	        $cff_photos_only_options.slideDown();
	    } else if (checked.length === 1 && checked[0].id === 'cff_show_video_type') {
	        $cff_videos_only_options.slideDown();
	    } else {
	        $cff_events_only_options.slideUp();
	        $cff_albums_only_options.slideUp();
	        $cff_photos_only_options.slideUp();
	        $cff_videos_only_options.slideUp();
	    }
	});


	//Header icon
	//Icon type
	//Check the saved icon type on page load and display it
	jQuery('#cff-header-icon-example').removeClass().addClass('fa fa-' + jQuery('#cff-header-icon').val() );
	//Change the header icon when selected from the list
	jQuery('#cff-header-icon').change(function() {
	    var $self = jQuery(this);

	    jQuery('#cff-header-icon-example').removeClass().addClass('fa fa-' + $self.val() );
	});

	//Test Facebook API connection button
	jQuery('#cff-api-test').click(function(e){
		e.preventDefault();
		//Show the JSON
		jQuery('#cff-api-test-result textarea').css('display', 'block');
	});


	//If 'Others only' is selected then show a note
	var $cffOthersOnly = jQuery('#cff-others-only');

	if ( jQuery("#cff_show_others option:selected").val() == 'onlyothers' ) $cffOthersOnly.show();
	
	jQuery("#cff_show_others").change(function() {
		if ( jQuery("#cff_show_others option:selected").val() == 'onlyothers' ) {
			$cffOthersOnly.show();
		} else {
			$cffOthersOnly.hide();
		}
	});

	//Selecting a post layout
	jQuery('.cff-layout').click(function(){
        var $self = jQuery(this);
        $self.addClass('cff-layout-selected').find('#cff_preset_layout').attr('checked', 'checked');
        $self.siblings().removeClass('cff-layout-selected');
        toggleMediaOptions();
    });

    //Add the color picker
	if( jQuery('.cff-colorpicker').length > 0 ) jQuery('.cff-colorpicker').wpColorPicker();

	//Show clear cache message when changing only events options
	// jQuery("#cff-admin .cff-please-clear-cache input, #cff-admin .cff-please-clear-cache select").change(function() {
	// 	jQuery('.cff-clear-cache-notice').show();
	// });


});