const dialogues = {

    v2: {

        firstCatch: [
            {
                speaker: 'richele',
                expression: 'stress',
                text:'"啊，薇尔丽芙枢机。”'
            },
            {
                speaker: 'v2',
                expression: 'biyan_smile',
                text:'“你好啊。”'
            },
            {
                speaker: 'v2',
                expression: 'thinking',
                text:'“不过不用叫我枢机了。我已经卸任了,换句话说——”'
            },
            {            
                speaker: 'v2',
                expression: 'normal',
                text:'“这事不归我管了。”'
            },
            {
                speaker: 'v2',
                expression: 'smile',
                text:'“这次当我没看见咯。”'
            },
            {
                speaker: 'richele',
                expression: 'stress',
                text:'“啊，哈哈......”'
            }
        ],

        secondCatch: [
            {   
                speaker: 'v2',
                expression: 'thinking',         
                text:'“虽说我确实是卸任了......”'
            },
            {
                speaker: 'richele',
                expression: 'suprise',
                text:'“......”'
            },
            {
                speaker: 'v2',
                expression: 'stress',
                text:'“不过普通公民也是可以举报的吧。”'
            }
        ],

        busyCatch: [
            {
                speaker: 'v2',
                expression: 'stress',
                text:'“我也不想管，不过你积压的工作也太多了吧。”'
            },
            {
                speaker: 'richele',
                expression: 'stress',
                text:'“......”'
            }
        ],

        aboutOren: [
            {
                speaker: 'v2',
                expression: 'thinking',
                text:'“奥伦啊...”'
            },
            {
                speaker: 'v2',
                expression: 'normal',
                text:'“我会提醒蕾缪安。”'
            },
            {
                speaker: 'v2',
                expression: 'stress',
                text:'“不过你嘛...小心点。”'
            },
            {
                speaker: 'richele',
                expression: 'stress',
                text:'“好。”'
            }
        ]
    },

    federico: {

        firstCatch: [
            {
                speaker: 'richele',
                expression: 'normal',
                text:'“嗨，费德里科。”'
            },
            {
                speaker: 'federico',
                expression: 'normal',
                text:'“里凯莱。”'
            },
            {
                speaker: 'federico',
                expression: 'normal',
                text:'“你应该在工作。”'
            },
            {
                speaker: 'richele',
                expression: 'normal',
                text:'“是啊，我起来走动走动。”'
            },
            {
                speaker: 'richele',
                expression: 'biyan_speak',
                text:'“总是坐在那太闷了不是。”'
            },
            {
                speaker: 'richele',
                expression: 'smile',
                text:'“这就回去了。那回见啦。”'
            }
        ],

        secondCatch: [
            {
                speaker: 'federico',
                expression: 'stress',
                text:'“根据公证所条例，我认为你的情况应当上报。”'
            },
            {
                speaker: 'richele',
                expression: 'stress',
                text:'“哈哈...”'
            }
        ],

        busyCatch: [
            {
                speaker: 'federico',
                expression: 'stress',
                text:'“执行者里凯莱，你今日对工作的懈怠已明显超出标准。”'
            },
            {
                speaker: 'richele',
                expression: 'stress',
                text:'“...”'
            }
        ],

        aboutOren: [
            {
                speaker: 'federico',
                expression: 'biyan',
                text:'“前万国信使奥伦。”'
            },
            {
                speaker: 'federico',
                expression: 'normal',
                text:'“我会去查明情况。”'
            },
            {
                speaker: 'richele',
                expression: 'biyan_speak',
                text:'“害。真是辛苦你了费德里科。”'
            }
        ]
    },

    lemuen: {

        firstCatch: [
            {
                speaker: 'lemuen',
                expression: 'normal',
                text:'“喔，”'
            },
            {
                speaker: 'lemuen',
                expression: 'smile',
                text:'“执行者先生。”'
            },
            {
                speaker: 'richele',
                expression: 'smile',
                text:'“枢机阁下。”'
            },
            {
                speaker: 'lemuen',
                expression: 'thinking',
                text:'“执行者先生已经在这边逛很久了，”'
            },
            {
                speaker: 'lemuen',
                expression: 'normal',
                text:'“公证所事务繁杂，想必你该回去工作了。”'
            }
        ],

        secondCatch: [
            {
                speaker: 'lemuen',
                expression: 'thinking',
                text:'“我听薇尔丽芙前辈说起过你。”'
            },
            {
                speaker: 'lemuen',
                expression: 'smile',
                text:'“这次就说不过去了吧。”'
            },
            {
                speaker: 'richele',
                expression: 'stress',
                text:'“...”'
            }
        ],

        busyCatch: [
            {
                speaker: 'lemuen',
                expression: 'strict',
                text:'“今天事情很多。执行者先生。”'
            },
            {
                speaker: 'richele',
                expression: 'stress',
                text:'“...好的，马上。”'
            }
        ],

        aboutOren: [
            {
                speaker: 'lemuen',
                expression: 'thinking',
                text:'“原来还有这事。”'
            },
            {
                speaker: 'lemuen',
                expression: 'normal',
                text:'“那这次就先这样吧。”'
            },
            {
                speaker: 'lemuen',
                expression: 'smile',
                text:'“下次可要注意了哦。”'
            },
            {
                speaker: 'richele',
                expression: 'stress',
                text:'“呃...哈哈好的。”'
            }
        ]
    },

    aze: {

        talk: [
            {
                speaker: 'aze',
                expression: 'normal',
                text:'“啊，里凯莱前辈。”'
            },
            {
                speaker: 'richele',
                expression: 'normal',
                text:'“你好啊艾泽尔。”'
            },
            {
                speaker: 'aze',
                expression: 'normal',
                text:'“我正在泡咖啡，前辈要来一杯吗？”'
            },
            {
                choices: [
                    {
                        label: '接受艾泽尔的咖啡',
                        effect: 'azeCoffee',
                        lines: [
                            {
                                speaker: 'richele',
                                expression: 'smile',
                                text:'“谢谢啦。”'
                            },
                            {
                                speaker: 'aze',
                                expression: 'smile',
                                text:'“请慢用，前辈。我先走了。”'
                            }
                        ]
                    },
                    {
                        label: '向艾泽尔寻求帮助',
                        effect: 'clearWork',
                        lines: [
                            {
                                speaker: 'richele',
                                expression: 'normal',
                                text:'“谢谢，不过咖啡就先不了。比起这个...”'
                            },
                            {
                                speaker: 'richele',
                                expression: 'stress',
                                text:'“呃...能帮我分担一下工作吗？实在是忙不过来呢。”'
                            },
                            {
                                speaker: 'aze',
                                expression: 'suprise',
                                text:'“原来如此，我明白了。”'
                            },
                            {
                                speaker: 'aze',
                                expression: 'smile',
                                text:'“交给我吧，前辈。”'
                            },
                            {
                                speaker: 'richele',
                                expression: 'happy',
                                text:'“真是太谢谢你了！”'
                            }
                        ]
                    }
                ]
            }
        ]
    },

    oren: {

        talk: [
            {
                speaker: 'oren',
                expression: 'normal',
                text:'“哟，里凯莱。”'
            },
            {
                speaker: 'richele',
                expression: 'strict',
                text:'“哟，奥伦。”'
            },
            {
                speaker: 'oren',
                expression: 'smile',
                text:'“怎么，又在偷懒？”'
            },
            {
                speaker: 'richele',
                expression: 'biyan_speak',
                text:'“少栽赃我。”'
            },
            {
                speaker: 'oren',
                expression: 'smile',
                text:'“哈！我懒得管。”'
            },
            {
                speaker: 'oren',
                expression: 'normal',
                text:'“我是想问你，上次和你要的文件，你找到了吗？”'
            },
            {
                speaker: 'richele',
                expression: 'strict',
                text:'“文件？”'
            },
            {
                speaker: 'richele',
                expression: 'happy',
                text:'“嗨呀，你不说我都忘了。”'
            },
            {
                speaker: 'richele',
                expression: 'smile',
                text:'“等我找到再给你。”'
            },
            {
                speaker: 'oren',
                expression: 'smile',
                text:'“那就麻烦你了。”'
            },
            {
                speaker: 'oren',
                expression: 'smile',
                text:'(不过这小子怎么突然笑得这么恶心)'
            }
        ],

        Catch: [
            {
                speaker: 'richele',
                expression: 'stress',
                text:'“...”'
            },
            {
                speaker: 'richele',
                expression: 'stress',
                text:'“哟，奥伦。”'
            },
            {
                speaker: 'oren',
                expression: 'strict',
                text:'“装没事人呢？”'
            },
            {
                speaker: 'oren',
                expression: 'angry',
                text:'“里凯莱，你这个骗子。”'
            },
            {
                speaker: 'oren',
                expression: 'yin',
                text:'“昨天你和你们那的大人物们是怎么说的？”'
            },
            {
                speaker: 'oren',
                expression: 'yin',
                text:'“看来我们几个之间有些误会啊。一起去枢机办公室聊聊吧。”'
            },
            {
                speaker: 'richele',
                expression: 'strict',
                text:'“！”'
            }
        ]
    },

    sply: {
        talk: [
            {
                speaker: 'sply',
                expression: 'biyan_smile',
                text:'"被我抓到了吧。”'
            },
            {
                speaker: 'richele',
                expression: 'smile',
                text:'“什么？”'
            },
            {
                speaker: 'sply',
                expression: 'smile',
                text:'"你不正在想方设法偷懒吗？”'
            },
            {
                speaker: 'sply',
                expression: 'biyan_smile',
                text:'"别装了，老实说吧——”'
            },
            {
                speaker: 'sply',
                expression: 'normal',
                text:'“给我带东西没，我可以接受贿赂。”'
            },
            {
                choices: [
                {
                    label: '将甜甜圈送给斯普莉雅',
                    effect: 'giveDonutToSply',
                    lines: [
                        {
                            speaker: 'richele',
                            expression: 'strict',
                            text:'“我从休息室刚拿的。”'
                        },
                        {
                            speaker: 'sply',
                            expression: 'smile',
                            text:'“我要的是点券啊！不过也行吧。”'
                        },
                        {
                            speaker: 'sply',
                            expression: 'biyan_smile',
                            text:'“那我就当没看见你咯。”'
                        },
                        {
                            speaker: 'sply',
                            expression: 'smile',
                            text: "对了，这个先借你用吧。"
                        },
                        {
                            speaker: 'sply',
                            expression: 'biyan_cat',
                            text: "就当我为你祈祷了。剩下的看你自己咯。"
                        }
                    ]
                },
                {
                    label: '我可没什么东西要给你',
                    effect: 'splyRefuse',
                    lines: [
                        {
                            speaker: 'richele',
                            expression: 'strict',
                            text:'“斯普莉雅，我可没什么东西要给你。”'
                        },
                        {
                            speaker: 'sply',
                            expression: 'cat_thinking',
                            text: "......"
                        },
                        {
                            speaker: 'sply',
                            expression: 'biyan_bad',
                            text: "那就公事公办咯。"
                        }
                    ]
                }
                ]
            }
        ]
    }
};

export default dialogues;