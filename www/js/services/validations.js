var _ = require('lodash');

angular.module('manager.services')

.constant('validations', {
  login: {
    username: {
      presence: true,
      email: true
    },
    password: {
      presence: true,
      length: {
        minimum: 6,
        message: "must be at least 6 characters"
      }
    }
  },
  categoryImport: {
    displayName: {
      presence: true,
      length: {
        minimum: 3
      }
    },
    keywords: {
      presence: true
    },
    active: {
      presence: true,
      inclusion: [true, false]
    },
    primary: {
      presence: true,
      inclusion: [true, false]
    }
  },
  countryImport: {
    name: {
      presence: true
    },
    displayName: {
      presence: true,
      length: {
        minimum: 2
      }
    },
    'country-code': {
      presence: true,
      length: {
        is: 3
      }
    },
    slug: {
      presence: true,
      length: {
        minimum: 3
      },
      format: {
        pattern: "[a-z0-9\-]+",
        flags: "i",
        message: "can only contain a-z, 0-9 and - (dashes)"
      }
    },
    active: {
      presence: true,
      inclusion: [true, false]
    }
  },
  category: {
    displayName: {
      presence: true,
      length: {
        minimum: 3
      }
    },
    slug: {
      presence: true,
      length: {
        minimum: 3
      },
      format: {
        pattern: "[a-z0-9\-]+",
        flags: "i",
        message: "can only contain a-z, 0-9 and - (dashes)"
      }
    },
    keywords: {
      presence: true,
      length: {
        minimum: 2
      }
    }
  },
  store: {
    displayName: {
      presence: true,
      length: {
        minimum: 2
      }
    },
    slug: {
      presence: true,
      length: {
        minimum: 3
      },
      format: {
        pattern: "[a-z0-9\-]+",
        flags: "i",
        message: "can only contain a-z, 0-9 and - (dashes)"
      }
    },
    keywords: {
      presence: true,
      length: {
        minimum: 2
      }
    },
    localShippingCost: {
      presence: true,
      numericality: {
        greaterThanOrEqualTo: 0
      }
    },
    localSaleMinimumAmount: {
      presence: true,
      numericality: {
        greaterThanOrEqualTo: 0
      }
    },
    domesticShippingCost: {
      presence: true,
      numericality: {
        greaterThanOrEqualTo: 0
      }
    },
    domesticSaleMinimumAmount: {
      presence: true,
      numericality: {
        greaterThanOrEqualTo: 0
      }
    }
  },
  product: {
    displayName: {
      presence: true,
      length: {
        minimum: 2
      }
    },
    slug: {
      presence: true,
      length: {
        minimum: 3
      },
      format: {
        pattern: "[a-z0-9\-]+",
        flags: "i",
        message: "can only contain a-z, 0-9 and - (dashes)"
      }
    },
    keywords: {
      presence: true,
      length: {
        minimum: 2
      }
    },
    active: {
      presence: true,
      inclusion: [true, false]
    },
    stock: {
      presence: true,
      numericality: {
        onlyInteger: true,
        greaterThanOrEqualTo: 0
      }
    },
    price: {
      presence: true,
      numericality: {
        greaterThanOrEqualTo: 0
      }
    }
  },
  toArray: function(items) {
    var messages = [];

    if(_.isObject(items)) {
      _.each(items, function(e) {
        if(_.isArray(e)) {
          e.forEach(function(m) {
            messages.push(m);
          });
        } else {
          messages.push(e);
        }
      });
    } else if(_.isString(items)) {
      messages.push(items);
    }

    return messages;
  }
})
