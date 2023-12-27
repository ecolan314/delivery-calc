document.addEventListener('DOMContentLoaded', () => {
    
    
if(document.querySelector('.delivery-calc')) {

    let pObj = {};
    document.querySelector('#product_info_for_calc').querySelectorAll('span').forEach(i => {
        pObj[i.dataset.name.slice(-3)] = i.dataset.value;
    });


    const prod = {
        price: (pObj.id2).replace(/\D/g, ""),   
        name: pObj.id1,
        pack: {
            sqMeters: pObj.id5,
            minOrder: pObj.id6,
            inPalette: pObj.id7,
            inPalleteRow: pObj.id8,
            weight: pObj.id3,
            height: pObj.id4,
            maxInHalfPallet: pObj.id9
        },
        pallete: {
            height: 15,
            weight: 15,
            price: 150
        },
        available: {
            inStock: 100
        }
    },
        calc = document.querySelector('.delivery-calc'),
        calcAnswer = calc.querySelector('.calc__answer'),
        inputPack = calc.querySelector('#productQuantityPackages'),
        inputSqMeters = calc.querySelector('#productQuantitySqMeters'),
        btnMinus = calc.querySelector('.calc_minus'),
        btnPlus = calc.querySelector('.calc_plus'),
        btnCityChoose = calc.querySelector('.calc_city-choose'),
        btnSubmit = calc.querySelector('.calc_submit'),
        valueMinOrder = calc.querySelector('.calc_min-order'),
        orderWeight = calc.querySelector('.calc__delivery-weight-kg'),
        calcOrderInner = calc.querySelector('.calc__order'),
        btnSpinner = calc.querySelector('.calc__spinner');

    let order = {
        pack: 0,
        sqMeters: 0,
        productSum: 0,
        packingSum: 0,
        sum: 0,
        delivery: {
            weight: 0,
            weightPerPallete: 0,
            heightPerPallete: 0,
            palleteQuantity: 0,
            novaPoshta: {
                city: '',
                cityId: '',
                ref: '',
                cityLoc: {},
                answerForm: function(data) {
                    let i  = document.createElement('div');
                    i.classList.add('calc__delivery-answer-inner');
                    i.innerHTML = `
                        доставка в: <br>
                        <span class="calc__delivery-answer-city">${order.delivery.novaPoshta.city}</span> <br>
                        Вартість доставки: <span class="calc__delivery-answer-sum">${data.data[0].Cost}</span> грн.
                    `;
                    document.querySelector('.novaposhta').append(i);
                },
                answerError: function(data) {
                    let i  = document.createElement('div');
                    i.classList.add('calc__delivery-answer-inner');
                    i.innerHTML = `
                        ${data.errors[0]}
                    `;
                    document.querySelector('.novaposhta').append(i);
                },
                cargoInfo: function(b) {
                    let c = [];
                    for (let i = 0; i < order.delivery.palleteQuantity; i++) {
                        c[i] = {
                            weight: order.delivery.weightPerPallete,
                            volumetricWidth: 120,
                            volumetricLength: 80,
                            volumetricHeight: order.delivery.heightPerPallete
                        }                        
                    }
                    return c
                },
                palleteType: {
                    euro: '',
                    halfEuro: '627b0c26-d110-11dd-8c0d-001d92f78697'
                }
            },
            deliveryAuto: {
                city: '',
                cityId: '',
                warehouseId: '',
                distanceToNPCity: 0,
                answerForm: function(data) {
                    let i  = document.createElement('div'),
                        link = fDel.warehouseLink();
                    i.classList.add('calc__delivery-answer-inner');
                    i.innerHTML = `
                        найближче відділення перевізника в: <br>
                        <span class="calc__delivery-answer-city">${order.delivery.deliveryAuto.city} ${(this.distanceToNPCity > 10 ? this.distanceToNPCity + ' км' : '')}</a></span> <br>
                        Вартість доставки (до відділення): <span class="calc__delivery-answer-sum">${data.data.allSumma}</span> грн.
                    `;
                    document.querySelector('.dauto').append(i);
                },
                answerError: function(data) {

                }
            }
        },
        calc: function() {
            // this.pack = inputPack.value;
            this.sqMeters = +((this.pack * prod.pack.sqMeters).toFixed(2));
            this.productSum = +((this.pack * prod.pack.sqMeters * prod.price).toFixed(2));
            this.delivery.palleteQuantity = Math.ceil(this.pack / prod.pack.inPalette);
            this.packingSum = this.productSum < 5000 ? this.delivery.palleteQuantity * prod.pallete.price : 0;
            this.sum = this.productSum + this.packingSum;
            this.delivery.weightPerPallete = Math.round(this.pack * prod.pack.weight / this.delivery.palleteQuantity) + prod.pallete.weight;
            this.delivery.heightPerPallete = Math.ceil(this.pack / this.delivery.palleteQuantity / prod.pack.inPalleteRow) * prod.pack.height + prod.pallete.height;
            this.delivery.weight = (this.delivery.weightPerPallete + this.delivery.palleteQuantity) * this.delivery.palleteQuantity;
            localStorage.setItem('calcOrderInSqM', this.sqMeters);
        }
    };

    const fNP = {
        url: 'https://api.novaposhta.ua/v2.0/json/',
        key: 'db2920b8e7e4cedd74c298713be433e8',
        reqCityList: function(city) {
            let i = {
                "apiKey": this.key,
                "modelName": "Address",
                "calledMethod": "searchSettlements",
                "methodProperties": {
                    "CityName" : city,
                    "Limit" : "5",
                    "Page" : "1"
                }
            }
            return i
        },
        reqCalculate: function(cityId) {
            let b = order.delivery.novaPoshta.cargoInfo(order.delivery.palleteQuantity);
                i = {
                "apiKey": this.key,
                "modelName": "InternetDocument",
                "calledMethod": "getDocumentPrice",
                "methodProperties": {
                    "CitySender" : "db5c88dc-391c-11dd-90d9-001a92567626",
                    "CityRecipient" :  cityId,
                    "Weight" :  order.delivery.weight,
                    "ServiceType" : "DoorsWarehouse",
                    "Cost" :  order.sum,
                    "CargoType" : "Pallet",
                    "SeatsAmount" : order.delivery.palleteQuantity,
                    "OptionsSeat": b
                }
            };
            if (order.pack <= prod.pack.maxInHalfPallet) {
                i.methodProperties.CargoDescription = order.delivery.novaPoshta.palleteType.halfEuro
            };
            return i
        },
        reqGetLocation: function() {
            let i = {
                "apiKey": this.key,
                "modelName": "Address",
                "calledMethod": "getSettlements",
                "methodProperties": {
                    "Ref" : order.delivery.novaPoshta.ref,
                    }
                };
                return i;
            }
    }

    const fDel = {
        url: 'https://www.delivery-auto.com/',
        warehouseLink: 'https://www.delivery-auto.com/uk-ua/representatives/details/',
        key: '',
        culture: 'uk-UA',
        cargoCategory: '1f07d03b-9e36-e311-8b0d-00155d037960',
        tariffs: {
            cargo: '00000000-0000-0000-0000-000000000000',
            pallete: '07dd5789-e648-e211-ab75-00155d012d0d'
        },
        nearestWarehouse: function(location) {
            let i = `${this.url}api/v4/Public/GetFindWarehouses?culture=${this.culture}&Longitude=${location.longitude}&Latitude=${location.latitude}&count=${1}&includeRegionalCenters=false`;
            return i;
        },
        warehouseDetail: function() {
            let i  = `${this.url}api/v4/Public/GetWarehousesInfo?culture=${this.culture}&WarehousesId=${order.delivery.deliveryAuto.warehouseId}`;
            return i;
        },
        warehouseLink: function() {
            let i = `https://www.delivery-auto.com/uk-ua/representatives/details/${order.delivery.deliveryAuto.warehouseId}`;
            return i;
        },

        calcUrl: function () {
            return `${this.url}api/v4/Public/PostReceiptCalculate`;
        },
        reqCalculate: function() {
            let i = {
                "culture": this.culture, //Культура
                "areasSendId": "725f7df3-a42a-e311-8b0d-00155d037960", //Місто відправлення
                "areasResiveId": order.delivery.deliveryAuto.cityId, //Місто прибуття
                "warehouseSendId": "d3f02796-4970-e211-9ce1-00155d012a15", //Склад відправлення
                "warehouseResiveId": order.delivery.deliveryAuto.warehouseId, //Склад прибуття
                "InsuranceValue": order.sum, //Страхова вартість вантажу
                "CashOnDeliveryValue": 0, //Вартість післяплати
                "dateSend": currentDate(),//"06.06.2014", //Дата відправлення
                "deliveryScheme": 0, //Схема доставки 0-"Warehouse-Warehouse"
                "category": [ //Масив категорій вантажу
                {
                "categoryId": (order.delivery.weight > 200 ? fDel.tariffs.pallete : fDel.tariffs.cargo), //Id категорії вантажу
                "countPlace": order.delivery.palleteQuantity, //Кількість місць
                "helf": order.delivery.weight, //Вага вантажу
                "size": ((120 * 80 * order.delivery.heightPerPallete / 1000000) * order.delivery.palleteQuantity) // Об’єм вантажу
                }],
                "dopUslugaClassificator": []
                };
                return i;
        },
    }

    btnCityChoose.addEventListener('click', () => {
        modalInner.classList.add('open');
    });

    



    let modalInner = document.createElement('div');
    modalInner.classList.add('calc-modal-window');
    modalInner.setAttribute('id', 'calc-open-modal');
    modalInner.innerHTML = `
        <div>
            <a href="" title="Close" class="calc-modal-close">
                <svg width="48" height="48" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_33_2)">
                <path d="M40 6.66666C58.41 6.66666 73.3333 21.59 73.3333 40C73.3333 58.41 58.41 73.3333 40 73.3333C21.59 73.3333 6.66667 58.41 6.66667 40C6.66667 21.59 21.59 6.66666 40 6.66666ZM32.93 28.2133C32.3315 27.6091 31.5248 27.2565 30.6748 27.2277C29.8249 27.1989 28.9961 27.496 28.3581 28.0582C27.72 28.6204 27.321 29.4053 27.2427 30.2521C27.1643 31.0989 27.4126 31.9436 27.9367 32.6133L28.2167 32.93L35.2833 39.9967L28.2167 47.07C27.6125 47.6685 27.2599 48.4752 27.2311 49.3251C27.2022 50.1751 27.4993 51.0039 28.0616 51.6419C28.6238 52.28 29.4086 52.679 30.2554 52.7573C31.1022 52.8357 31.9469 52.5874 32.6167 52.0633L32.93 51.7867L40 44.7133L47.07 51.7867C47.6685 52.3908 48.4752 52.7434 49.3252 52.7723C50.1751 52.8011 51.0039 52.504 51.6419 51.9418C52.28 51.3795 52.679 50.5947 52.7573 49.7479C52.8357 48.9011 52.5874 48.0564 52.0633 47.3867L51.7867 47.07L44.7133 40L51.7867 32.93C52.3908 32.3315 52.7434 31.5248 52.7723 30.6748C52.8011 29.8249 52.504 28.9961 51.9418 28.3581C51.3796 27.72 50.5947 27.321 49.7479 27.2426C48.9011 27.1643 48.0564 27.4126 47.3867 27.9367L47.07 28.2133L40 35.2867L32.93 28.2133Z" fill="black"/>
                </g>
                <defs>
                <clipPath id="clip0_33_2">
                <rect width="80" height="80" fill="white"/>
                </clipPath>
                </defs>
                </svg>
            </a>
            
            <div class="modal-inner">
                <input type="city" class="form-control" id="delivery-city" placeholder="Введіть населений пункт" autocomplete="off"/>
                <ul class="calc__city-list">
                </ul>
            </div>
        </div>
    `;

    let btnModalClose = modalInner.querySelector('.calc-modal-close');

    btnModalClose.addEventListener('click', (e) => {
        e.preventDefault();
        modalInner.classList.remove('open');
    });

    modalInner.querySelector(".form-control").addEventListener("input", function(){
        this.value = this.value.replace(/[^А-Яа-яІіЇїЄєҐґ'-\s]/, "");
    });


    document.body.append(modalInner);

    const inputCityChoose = document.querySelector('#delivery-city'),
        cityList = document.querySelector('.calc__city-list');

    //some help functions 

    function currentDate () {
        let date = new Date().toLocaleDateString('ru-RU');
        return date;
    }

    function localStorageCheck () {
        if(localStorage.getItem('calcOrderInSqM')) {
            order.pack = Math.round((localStorage.getItem('calcOrderInSqM') / prod.pack.sqMeters).toFixed(4));
            inputPack.value = order.pack;
        }
    }

    //Sq Meters Calculate
    function sqMetersCalc() {

        if (order.pack < prod.pack.minOrder) {
            order.pack = prod.pack.minOrder;
            inputPack.value = order.pack;
            inputSqMeters.value = (order.pack * prod.pack.sqMeters).toFixed(2);
        } else {
            inputPack.value = order.pack;
            inputSqMeters.value = (order.pack * prod.pack.sqMeters).toFixed(2);
        }    
    }

    function calcOrder () {
        order.calc();
        calcOrderInner.innerHTML = `
            <div class="calc__order-header">Ваше замовлення:</div>
            <div class="calc__order-item">
                <div class="calc__order-item-name">Плитка ${prod.name}</div>
                <div class="calc__order-item-inner">
                    <div class="calc__order-item-quantity">${order.pack} упак. (${order.sqMeters} кв.м)</div>
                    <div class="calc__order-item-sum">${order.productSum} грн.</div>
                </div>
            </div>
            <div class="calc__order-item">
                <div class="calc__order-item-name">Дерев'яний піддон</div>
                <div class="calc__order-item-inner">
                    <div class="calc__order-item-quantity">${order.delivery.palleteQuantity} шт</div>
                    <div class="calc__order-item-sum">${order.packingSum === 0 ? 'безкоштовно' : order.packingSum + ' грн.'}</div>
                </div>
            </div>
            <div class="calc__order-summary">
                <div class="calc__order-name">За замовлення:</div>
                <div class="calc__order-sum">${order.sum} грн.</div>
            </div>
            <div class="calc__order-item hidden">
                Наявність уточнюйте у менеджера
            </div>
        `;
        orderWeight.textContent = order.delivery.weight;
    }

    //Start calc
    localStorageCheck();
    sqMetersCalc();

    valueMinOrder.textContent = prod.pack.minOrder;



    inputPack.addEventListener('input', ()=> {
        order.pack = Number(inputPack.value);
        sqMetersCalc();
    });

    btnMinus.addEventListener('click', () => {
        --order.pack;
        sqMetersCalc();
    });

    btnPlus.addEventListener('click', () => {
        ++order.pack;
        sqMetersCalc();
    });

    btnSubmit.addEventListener('click', () => {
        btnSubmit.disabled = true;
        btnSpinner.classList.add('spinner-active');
        calcAnswer.parentElement.classList.add('calc__answer-container-open');
        calcAnswer.style.display = 'flex';
        calcOrderInner.innerHTML = '';
        calcOrder();
        
        fetch (fNP.url, {
            method: 'POST',
            body: JSON.stringify(fNP.reqCalculate(order.delivery.novaPoshta.cityId)), 
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
        .then((response) => response.json())
        .then((data) => {
                
                if(data.success === true) {
                    document.querySelector('.novaposhta').querySelector('.calc__delivery-answer-inner').remove();
                    order.delivery.novaPoshta.answerForm(data);
                } else {
                    document.querySelector('.novaposhta').querySelector('.calc__delivery-answer-inner').remove();
                    order.delivery.novaPoshta.answerError(data);
                    console.log(data);
                }

        })
        .catch(() => {
            document.querySelector('.novaposhta').querySelector('.calc__delivery-answer-inner').innerHTML = "Під час запиту на сервер Нової пошти сталася помилка :( <br> Спробуйте трохи пізніше";
        });


        // DeliveryAuto calculate #1 - #3

        // #1 get city location from NP

        fetch (fNP.url, {
            method: 'POST',
            body: JSON.stringify(fNP.reqGetLocation()), 
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
        .then((response) => response.json())
        .then((data) => {
            order.delivery.novaPoshta.cityLoc = {
                longitude: data.data[0].Longitude,
                latitude: data.data[0].Latitude
            }
        })
        
        // #2 search nearest DeliveryAuto warehouse
        
        .then(() =>
            fetch (fDel.nearestWarehouse(order.delivery.novaPoshta.cityLoc))
            .then((response) => response.json())
            .then((data) => {
                order.delivery.deliveryAuto.city = data.data[0].cityName;
                order.delivery.deliveryAuto.warehouseId = data.data[0].id;
                order.delivery.deliveryAuto.distanceToNPCity = Math.round(data.data[0].distance);
            })
        )

        .then(() => 
            fetch (fDel.warehouseDetail())
            .then((response) => response.json())
            .then((data) => {
                order.delivery.deliveryAuto.cityId = data.data.CityId;
            })
        )

        // #3 calculate delivery cost

        .then(() => 
            fetch (fDel.calcUrl(), {
                method: 'POST',
                body: JSON.stringify(fDel.reqCalculate()), 
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            })
            .then((response) => response.json())
            .then((data) => {
                document.querySelector('.dauto').querySelector('.calc__delivery-answer-inner').remove();
                order.delivery.deliveryAuto.answerForm(data);
            })
        )
        .catch(() => {
            document.querySelector('.dauto').querySelector('.calc__delivery-answer-inner').innerHTML = "Під час запиту на сервер Делівері Авто сталася помилка :( <br> Спробуйте трохи пізніше";
        })
        .finally(()=>{
            btnSpinner.classList.remove('spinner-active');
            setTimeout(() => btnSubmit.disabled = false, 8000);
        })

    });




    let newItem = function(i, d, r, w, a) {
        let b = document.createElement('li');
        if (w > 0 || a === true) {
            if (w === 0) {
                b.innerHTML = `<a href="" class="">${i} (адресна доставка)</a>`;
            } else if(a === false) {
                b.innerHTML = `<a href="" class="">${i} (можливість доставки уточнюйте)</a>`;
            } else {
                b.innerHTML = `<a href="" class="">${i}</a>`;
            };
            cityList.append(b);
            
            b.addEventListener('click', (e) => {
                e.preventDefault();
                modalInner.classList.remove('open');
                btnCityChoose.textContent = i;
                order.delivery.novaPoshta.city = i;
                order.delivery.novaPoshta.cityId = d;
                order.delivery.novaPoshta.ref = r;
                btnCityChoose.setAttribute('delivery-city', d);
                btnCityChoose.classList.add('calc__btn-light-city-choose');
                btnSubmit.disabled = false;
                // document.querySelector('#calcButton').disabled = false;
        });
        } else {
            b.innerHTML = `<a class="delivery-impossible">${i} - доставка недоступна</a>`;
            cityList.append(b);
        };
        
    }




    inputCityChoose.addEventListener('input', () => {
        if(inputCityChoose.value.length > 3) {
            fetch (fNP.url, {
                method: 'POST',
                body: JSON.stringify(fNP.reqCityList(inputCityChoose.value)), 
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            })
            .then((response) => response.json())
            .then((data) => {
                cityList.innerHTML = '';
                data.data[0].Addresses.forEach(i => newItem(i.Present, i.DeliveryCity, i.Ref, i.Warehouses, i.AddressDeliveryAllowed));
            })
            .catch(() => {
                cityList.innerHTML = "Під час запиту на сервер Нової пошти сталася помилка :( <br> Спробуйте трохи пізніше";
            })
        }
        
    });

}

});
