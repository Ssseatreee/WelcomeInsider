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
                expression: 'strict',
                text:'“执行者里凯莱，你今日对工作的懈怠已明显超出标准。”'
            },
            {
                speaker: 'richele',
                expression: 'stress',
                text:'“...”'
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
                            }
                        ]
                    }
                ]
            }
        ]
    }
};

export default dialogues;