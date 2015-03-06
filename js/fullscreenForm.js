;( function( window ) {

	'use strict';

	// Matrices of values

	var fuelPrice = { // euros
		'diesel': 1.23,
		'essence': 1.40
	}

	var consoMatrix = {
		'citadine': {
			'essence': {
				'route': 5.5,
				'mixte': 6.1,
				'ville': 7
			},
			'diesel': {
				'route': 4.5,
				'mixte': 5,
				'ville': 5.8
			}
		},
		'compact': {
			'essence': {
				'route': 6.6,
				'mixte': 7.3,
				'ville': 8.4
			},
			'diesel': {
				'route': 5,
				'mixte': 5.6,
				'ville': 6.4
			}
		},
		'monospace': {
			'essence': {
				'route': 7,
				'mixte': 7.8,
				'ville': 9
			},
			'diesel': {
				'route': 5.8,
				'mixte': 6.4,
				'ville': 7.4
			}
		}
	};
	var insurance = 83;
	var cleaning = 46;

	// Support
	var support = { animations : Modernizr.cssanimations },
		animEndEventNames = { 'WebkitAnimation' : 'webkitAnimationEnd', 'OAnimation' : 'oAnimationEnd', 'msAnimation' : 'MSAnimationEnd', 'animation' : 'animationend' },
		// animation end event name
		animEndEventName = animEndEventNames[ Modernizr.prefixed( 'animation' ) ];

	/**
	 * extend obj function
	 */
	function extend( a, b ) {
		for( var key in b ) {
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	/**
	 * createElement function
	 * creates an element with tag = tag, className = opt.cName, innerHTML = opt.inner and appends it to opt.appendTo
	 */
	function createElement( tag, opt ) {
		var el = document.createElement( tag )
		if( opt ) {
			if( opt.cName ) {
				el.className = opt.cName;
			}
			if( opt.inner ) {
				el.innerHTML = opt.inner;
			}
			if( opt.appendTo ) {
				opt.appendTo.appendChild( el );
			}
		}
		return el;
	}

	/**
	 * FForm function
	 */
	function FForm( el, options ) {
		this.el = el;
		this.pageName = options.pageName;
		this.store = { alreadyVisited: {} };
		this.options = extend( {}, this.options );
  		extend( this.options, options );
  		this._init();
	}

	/**
	 * FForm options
	 */
	FForm.prototype.options = {
		// show progress bar
		ctrlProgress : true,
		// show navigation dots
		ctrlNavDots : true,
		// show [current field]/[total fields] status
		ctrlNavPosition : true,
		// reached the review and submit step
		onReview : function() { return false; }
	};

	/**
	 * init function
	 * initialize and cache some vars
	 */
	FForm.prototype._init = function() {
		var self = this;
		// the form element
		this.formEl = this.el.querySelector( 'form' );

		// list of fields
		this.fieldsList = this.formEl.querySelector( 'ol.fs-fields' );

		// current field position
		this.current = 0;

		// Link google events with the "see solutions button"
		document.getElementById('link-to-solutions').addEventListener('click', function(e) {
			var eventName = this.pageName + ':solutions';
			ga('send', 'event', 'rci', eventName);
			this.href += '?expenses=' + (self.store.expenses || 0);
		});

		// Add basic infos
		document.getElementById('q5a').value = insurance;
		document.getElementById('q5b').value = cleaning;
		this.store.insurance = insurance;
		this.store.cleaning = cleaning;

		// all fields
		this.fields = [].slice.call( this.fieldsList.children );

		// total fields
		this.fieldsCount = this.fields.length;

		// show first field
		classie.add( this.fields[ this.current ], 'fs-current' );

		// create/add controls
		this._addControls();

		// create/add messages
		this._addErrorMsg();

		// init events
		this._initEvents();
	};

	/**
	 * addControls function
	 * create and insert the structure for the controls
	 */
	FForm.prototype._addControls = function() {
		// main controls wrapper
		this.ctrls = createElement( 'div', { cName : 'fs-controls', appendTo : this.el } );

		// continue button (jump to next field)
		this.ctrlContinue = createElement( 'button', { cName : 'fs-continue', inner : 'Continue', appendTo : this.ctrls } );
		this._showCtrl( this.ctrlContinue );

		// navigation dots
		if( this.options.ctrlNavDots ) {
			this.ctrlNav = createElement( 'nav', { cName : 'fs-nav-dots', appendTo : this.ctrls } );
			var dots = '';
			for( var i = 0; i < this.fieldsCount; ++i ) {
				dots += i === this.current ? '<button class="fs-dot-current">' + i + '</button>' : '<button disabled>' + i + '</button>';
			}
			this.ctrlNav.innerHTML = dots;
			this._showCtrl( this.ctrlNav );
			this.ctrlNavDots = [].slice.call( this.ctrlNav.children );
		}

		// field number status
		if( this.options.ctrlNavPosition ) {
			// this.ctrlFldStatus = createElement( 'span', { cName : 'fs-numbers', appendTo : this.ctrls } );

			// current field placeholder
			//this.ctrlFldStatusCurr = createElement( 'span', { cName : 'fs-number-current', inner : Number( this.current + 1 ) } );
			//this.ctrlFldStatus.appendChild( this.ctrlFldStatusCurr );

			// total fields placeholder
			//this.ctrlFldStatusTotal = createElement( 'span', { cName : 'fs-number-total', inner : this.fieldsCount } );
			//this.ctrlFldStatus.appendChild( this.ctrlFldStatusTotal );
			//this._showCtrl( this.ctrlFldStatus );
		}

		// progress bar
		if( this.options.ctrlProgress ) {
			this.ctrlProgress = createElement( 'div', { cName : 'fs-progress', appendTo : this.ctrls } );
			this._showCtrl( this.ctrlProgress );
		}
	}

	/**
	 * addErrorMsg function
	 * create and insert the structure for the error message
	 */
	FForm.prototype._addErrorMsg = function() {
		// error message
		this.msgError = createElement( 'span', { cName : 'fs-message-error', appendTo : this.el } );
	}

	/**
	 * init events
	 */
	FForm.prototype._initEvents = function() {
		var self = this;

		// show next field
		this.ctrlContinue.addEventListener( 'click', function(ev) {
			// Check if a condition is fullfiled before moving to the next field
			self._nextField();
		} );

		// Tracking
		document.getElementById('discoverAdvices').addEventListener('click', function() {
			// Check if a condition is fullfiled before moving to the next field
			var eventName = this.pageName + ':conseils';
			ga('send', 'event', 'rci', eventName);
		});

		// show initial button
		document.getElementById('startButton').addEventListener('click', function() {
			// Check if a condition is fullfiled before moving to the next field
			var eventName = this.pageName + ':j\'essaye';
			ga('send', 'event', 'rci', eventName);
			self.ctrlContinue.click();
		});

		// init range slider
		document.getElementById('q4').addEventListener('input', function() {
			// Check if a condition is fullfiled before moving to the next field
			document.querySelector('#volume').innerHTML = this.value;
		});
		// init range slider
		document.getElementById('q4').addEventListener('change', function() {
			// Check if a condition is fullfiled before moving to the next field
			self.store.km = parseInt(this.value, 10);
			self._calculateExpenses();
			self.ctrlContinue.click();
		});

		// init "other expenses" inputs
		document.getElementById('q5a').addEventListener('change', function() {
			// Check if a condition is fullfiled before moving to the next field
			self.store.insurance = parseInt(this.value, 10);
			self._calculateExpenses();
		});
		document.getElementById('q5b').addEventListener('change', function() {
			// Check if a condition is fullfiled before moving to the next field
			self.store.cleaning = parseInt(this.value, 10);
			self._calculateExpenses();
		});

		// navigation dots
		if( this.options.ctrlNavDots ) {
			this.ctrlNavDots.forEach( function( dot, pos ) {
				dot.addEventListener( 'click', function() {
					self._showField( pos );
				} );
			} );
		}

		// jump to next field without clicking the continue button (for fields/list items with the attribute "data-input-trigger")
		this.fields.forEach( function( fld ) {
			if( fld.hasAttribute( 'data-input-trigger' ) ) {
				var input = fld.querySelector( 'input[type="radio"]' ) || /*fld.querySelector( '.cs-select' ) ||*/ fld.querySelector( 'select' ); // assuming only radio and select elements (TODO: exclude multiple selects)
				if( !input ) return;

				switch( input.tagName.toLowerCase() ) {
					case 'select' :
						input.addEventListener( 'change', function(ev) { self._fieldHandler(ev); } );
						break;

					case 'input' :
						[].slice.call( fld.querySelectorAll( 'input[type="radio"]' ) ).forEach( function( inp ) {
							inp.addEventListener( 'change', function(ev) { self._fieldHandler(ev); } );
						} );
						break;

					/*
					// for our custom select we would do something like:
					case 'div' :
						[].slice.call( fld.querySelectorAll( 'ul > li' ) ).forEach( function( inp ) {
							inp.addEventListener( 'click', function(ev) { self._fieldHandler(); } );
						} );
						break;
					*/
				}
			}
		} );

		// keyboard navigation events - jump to next field when pressing enter
		document.addEventListener( 'keydown', function( ev ) {
			if( !self.isLastStep && ev.target.tagName.toLowerCase() !== 'textarea' ) {
				var keyCode = ev.keyCode || ev.which;
				if( keyCode === 13 ) {
					ev.preventDefault();
					self._fieldHandler(ev);
				}
			}
		} );
	};

	/**
	 * nextField function
	 * jumps to the next field
	 */
	FForm.prototype._nextField = function( backto ) {
		if( this.isLastStep || !this._validade() || this.isAnimating ) {
			return false;
		}
		this.isAnimating = true;

		// check if on last step
		this.isLastStep = this.current === this.fieldsCount - 1 && backto === undefined ? true : false;

		// clear any previous error messages
		this._clearError();

		// current field
		var currentFld = this.fields[ this.current ];

		// save the navigation direction
		this.navdir = backto !== undefined ? backto < this.current ? 'prev' : 'next' : 'next';

		// update current field
		this.current = backto !== undefined ? backto : this.current + 1;

		if( backto === undefined ) {
			// update progress bar (unless we navigate backwards)
			this._progress();

			// save farthest position so far
			this.farthest = this.current;
		}

		// add class "fs-display-next" or "fs-display-prev" to the list of fields
		classie.add( this.fieldsList, 'fs-display-' + this.navdir );

		// remove class "fs-current" from current field and add it to the next one
		// also add class "fs-show" to the next field and the class "fs-hide" to the current one
		classie.remove( currentFld, 'fs-current' );
		classie.add( currentFld, 'fs-hide' );

		if( !this.isLastStep ) {
			// update nav
			this._updateNav();

			// change the current field number/status
			this._updateFieldNumber();

			var nextField = this.fields[ this.current ];
			classie.add( nextField, 'fs-current' );
			classie.add( nextField, 'fs-show' );
		}

		// after animation ends remove added classes from fields
		var self = this,
			onEndAnimationFn = function( ev ) {
				if( support.animations ) {
					this.removeEventListener( animEndEventName, onEndAnimationFn );
				}

				classie.remove( self.fieldsList, 'fs-display-' + self.navdir );
				classie.remove( currentFld, 'fs-hide' );

				if( self.isLastStep ) {
					// show the complete form and hide the controls
					self._hideCtrl( self.ctrlNav );
					self._hideCtrl( self.ctrlProgress );
					self._hideCtrl( self.ctrlContinue );
					//self._hideCtrl( self.ctrlFldStatus );
					// replace class fs-form-full with fs-form-overview
					classie.remove( self.formEl, 'fs-form-full' );
					classie.add( self.formEl, 'fs-form-overview' );
					classie.add( self.formEl, 'fs-show' );
					// callback
					self.options.onReview();
				}
				else {
					classie.remove( nextField, 'fs-show' );

					if( self.options.ctrlNavPosition ) {
						//self.ctrlFldStatusCurr.innerHTML = self.ctrlFldStatusNew.innerHTML;
						//self.ctrlFldStatus.removeChild( self.ctrlFldStatusNew );
						//classie.remove( self.ctrlFldStatus, 'fs-show-' + self.navdir );
					}
				}
				self.isAnimating = false;
			};

		if( support.animations ) {
			if( this.navdir === 'next' ) {
				if( this.isLastStep ) {
					currentFld.querySelector( '.fs-anim-upper' ).addEventListener( animEndEventName, onEndAnimationFn );
				}
				else {
					nextField.querySelector( '.fs-anim-lower' ).addEventListener( animEndEventName, onEndAnimationFn );
				}
			}
			else {
				nextField.querySelector( '.fs-anim-upper' ).addEventListener( animEndEventName, onEndAnimationFn );
			}
		}
		else {
			onEndAnimationFn();
		}
	}

	/**
	 * showField function
	 * jumps to the field at position pos
	 */
	FForm.prototype._showField = function( pos ) {
		if( pos === this.current || pos < 0 || pos > this.fieldsCount - 1 ) {
			return false;
		}
		this._nextField( pos );
	}

	/**
	 * updateFieldNumber function
	 * changes the current field number
	 */
	FForm.prototype._updateFieldNumber = function() {
		if( this.options.ctrlNavPosition ) {
			// first, create next field number placeholder
			//this.ctrlFldStatusNew = document.createElement( 'span' );
			//this.ctrlFldStatusNew.className = 'fs-number-new';
			//this.ctrlFldStatusNew.innerHTML = Number( this.current + 1 );

			// insert it in the DOM
//			this.ctrlFldStatus.appendChild( this.ctrlFldStatusNew );

			// add class "fs-show-next" or "fs-show-prev" depending on the navigation direction
			var self = this;
			setTimeout( function() {
				//classie.add( self.ctrlFldStatus, self.navdir === 'next' ? 'fs-show-next' : 'fs-show-prev' );
			}, 25 );
		}
	}

	/**
	 * progress function
	 * updates the progress bar by setting its width
	 */
	FForm.prototype._progress = function() {
		if( this.options.ctrlProgress ) {
			this.ctrlProgress.style.width = this.current * ( 100 / this.fieldsCount ) + '%';
		}
	}

	/**
	 * updateNav function
	 * updates the navigation dots
	 */
	FForm.prototype._updateNav = function() {
		if( this.options.ctrlNavDots ) {
			classie.remove( this.ctrlNav.querySelector( 'button.fs-dot-current' ), 'fs-dot-current' );
			classie.add( this.ctrlNavDots[ this.current ], 'fs-dot-current' );
			this.ctrlNavDots[ this.current ].disabled = false;
		}
	}

	/**
	 * showCtrl function
	 * shows a control
	 */
	FForm.prototype._showCtrl = function( ctrl ) {
		classie.add( ctrl, 'fs-show' );
	}

	/**
	 * hideCtrl function
	 * hides a control
	 */
	FForm.prototype._hideCtrl = function( ctrl ) {
		classie.remove( ctrl, 'fs-show' );
	}

	// TODO: this is a very basic validation function. Only checks for required fields..
	FForm.prototype._validade = function() {
		var fld = this.fields[ this.current ],
			input = fld.querySelector( 'input[required]' ) || fld.querySelector( 'textarea[required]' ) || fld.querySelector( 'select[required]' ),
			error;

		if( !input ) return true;

		switch( input.tagName.toLowerCase() ) {
			case 'input' :
				if( input.type === 'radio' || input.type === 'checkbox' ) {
					var checked = 0;
					[].slice.call( fld.querySelectorAll( 'input[type="' + input.type + '"]' ) ).forEach( function( inp ) {
						if( inp.checked ) {
							++checked;
						}
					} );
					if( !checked ) {
						error = 'NOVAL';
					}
				}
				else if( input.value === '' ) {
					error = 'NOVAL';
				}
				break;

			case 'select' :
				// assuming here '' or '-1' only
				if( input.value === '' || input.value === '-1' ) {
					error = 'NOVAL';
				}
				break;

			case 'textarea' :
				if( input.value === '' ) {
					error = 'NOVAL';
				}
				break;
		}

		if( error != undefined ) {
			this._showError( error );
			return false;
		}

		return true;
	}

	// TODO
	FForm.prototype._showError = function( err ) {
		var message = '';
		switch( err ) {
			case 'NOVAL' :
				message = 'Veuillez remplir le champ avant de continuer.';
				break;
			case 'INVALIDEMAIL' :
				message = 'Veuillez entrer une adresse email valide.';
				break;
			// ...
		};
		this.msgError.innerHTML = message;
		this._showCtrl( this.msgError );
	}

	// clears/hides the current error message
	FForm.prototype._clearError = function() {
		this._hideCtrl( this.msgError );
	}

	// Add at each step
	FForm.prototype._fieldHandler = function(ev) {
		var currentFld = this.fields[ this.current ];
		var substrId = ev.target.id.substr(0, 2);
		var fieldValue = ev.target.value;

		console.log('Store: ', this.store[substrId]);
		if (this.store[substrId]) {
			this.store.alreadyVisited[substrId] = true;
		}

		// If everything's fine, set value in the store
		this.store[substrId] = fieldValue;

		// If value already exists, update the expenses and return
		if ( this.store.alreadyVisited[substrId] ) {
			return this._calculateExpenses();
		}

		// Send event to GA
		// ga('send', 'event', 'rci', 'next', 'Next step' + substrId);
		// If no condition are met, move on to the next field
		this._nextField();
	}

	FForm.prototype._calculateExpenses = function () {
		// Calculate expenses
		var store = this.store;
		var finalFuelPrice = fuelPrice[this.store['q2']];
		var conso = consoMatrix[store['q1']][store['q2']][store['q3']];
		var insu = this.store.insurance;
		var clean = this.store.cleaning;
		var expenses = ((this.store.km * 4) * (conso / 100) * finalFuelPrice + insu + clean).toFixed(2);
		this.store.expenses = expenses;
		// Update the field
		var expensesEl = document.querySelector('.fs-expenses');
		var isShown = classie.has(expensesEl, 'fs-show' )
		if (!isShown) {
			classie.add(expensesEl, 'fs-show');
		}
		document.getElementById('expenses').innerHTML = expenses + '&euro;';
		// Send event to GA
		// ga('send', 'event', 'rci', 'calculate', 'L\'utilisateur calcul ses frais', expenses);
	}

	// add to global namespace
	window.FForm = FForm;

})( window );
