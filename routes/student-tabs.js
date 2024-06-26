const express = require("express");
const studentTabs = express.Router();
const User = require("../functions/user.js");
const MongoClient = require("mongodb").MongoClient;
const DB_CONNECTION_URL = require("../config/db.js");
const config = require("../config/config.json");
const getResultFromCursor = require("../functions/getResultFromCursor.js");
const purifyDataSet = require("../functions/purifyDataSet.js");
const path = require("path");
const fs = require("fs");

//Main Home tab in Dashboard of Student
studentTabs.post("/main", async (req, res) => {
    const user = await new User(req);
    await user
        .initialize()
        .then(async (data) => {
            if (data.isLoggedIn && user.hasAccessOf("student")) {
                var userData = await user.getUserData(data.user, {
                    _id: 0,
                    email: 1,
                    pic_ext: 1,
                    "data.name": 1,
                    "data.admission.course": 1,
                    "data.phone": 1,
                    about: 1,
                    messages: 1,
                });
                await MongoClient.connect(DB_CONNECTION_URL, {
                    useUnifiedTopology: true,
                }).then(async (mongo) => {
                    var db = await mongo.db(config.DB_SERVER.DB_DATABASE);
                    await Promise.all([
                        db
                            .collection("user_data")
                            .aggregate([
                                {
                                    $match: {
                                        type: "recruiter",
                                        "data.job": {
                                            $exists: true,
                                        },
                                    },
                                },
                                {
                                    $project: {
                                        "data.name": 1,
                                        "data.website": 1,
                                        "data.job.salary": 1,
                                        "data.job.vacancy": 1,
                                        "data.job.title": 1,
                                        "data.job.type": 1,
                                    },
                                },
                                {
                                    $addFields: {
                                        rank: {
                                            $add: [
                                                {
                                                    $divide: [
                                                        "$data.job.salary",
                                                        1000,
                                                    ],
                                                },
                                                "$data.job.vacancy",
                                            ],
                                        },
                                    },
                                },
                                {
                                    $sort: {
                                        rank: -1,
                                        "data.job.salary": -1,
                                    },
                                },
                            ])
                            .limit(10),
                        db.collection("user_data").aggregate([
                            {
                                $match: {
                                    type: "coordinator",
                                },
                            },
                            {
                                $project: {
                                    email: 1,
                                    "data.name": 1,
                                    "data.about": 1,
                                    "data.admission.course": 1,
                                    pic_ext: 1,
                                },
                            },
                        ]),
                        db.collection("user_data").aggregate([
                            {
                                $match: {
                                    $or: [
                                        { type: "student" },
                                        { type: "coordinator" },
                                    ],
                                },
                            },
                            {
                                $group: {
                                    _id: "$data.admission.course",
                                    count: {
                                        $sum: 1,
                                    },
                                },
                            },
                            {
                                $sort: { count: 1 },
                            },
                        ]),
                        db.collection("statistical_data").aggregate([
                            {
                                $sort: {
                                    year: 1,
                                },
                            },
                        ]),
                    ])
                        .then(([a, b, c, d]) => {
                            return Promise.all([
                                getResultFromCursor(a),
                                getResultFromCursor(b),
                                getResultFromCursor(c),
                                getResultFromCursor(d),
                            ]);
                        })
                        .then(
                            ([
                                companies,
                                coordinators,
                                department,
                                statistics,
                            ]) => {
                                res.render(`student/dashboard-tabs/main`, {
                                    email: userData.result.email,
                                    profilepic: `../data/profilepic/${userData.result.email}.${userData.result.pic_ext}`,
                                    name: userData.result.data.name,
                                    course: userData.result.data.admission
                                        .course,
                                    phone: userData.result.data.phone,
                                    about: userData.result.data.about,
                                    messages: userData.result.messages,
                                    companies,
                                    coordinators,
                                    department,
                                    statistics
                                });
                            }
                        );
                });
            } else {
                throw new Error("Not Logged In / Don't have access");
            }
        })
        .catch((error) => {
            console.log(error.message);
            res.status(500);
            res.end("");
        });
});

//View all Drives
studentTabs.post("/drive", async (req, res) => {
    const user = await new User(req);
    await user.initialize().then(async (data) => {
        if (data.isLoggedIn && user.hasAccessOf("student")) {
            var userData = await user.getUserData(data.user, {
                _id: 0,
                email: 1,
                "data.education.skills": 1,
            });
            await MongoClient.connect(DB_CONNECTION_URL, {
                useUnifiedTopology: true,
            })
                .then(async (mongo) => {
                    var db = await mongo.db(config.DB_SERVER.DB_DATABASE);
                    return await db.collection("user_data").aggregate([
                        {
                            $match: {
                                type: "recruiter",
                                "data.job": {
                                    $exists: true,
                                },
                                "data.job.date": {
                                    $gt: new Date() - 0,
                                },
                            },
                        },
                        {
                            $project: {
                                email: 1,
                                "data.name": 1,
                                "data.website": 1,
                                "data.job.salary": 1,
                                "data.job.vacancy": 1,
                                "data.job.title": 1,
                                "data.job.date": 1,
                                "data.job.mhskills": 1,
                                "data.job.ghskills": 1,
                                "data.job.vacancy": 1,
                                "data.job.rounds": 1,
                                "data.job.description": 1,
                                "data.job.type": 1,
                                "data.job.applied": 1,
                            },
                        },
                        {
                            $addFields: {
                                rank: {
                                    $add: [
                                        {
                                            $divide: ["$data.job.salary", 1000],
                                        },
                                        "$data.job.vacancy",
                                    ],
                                },
                                applied: {
                                    $in: [
                                        userData.result.email,
                                        "$data.job.applied",
                                    ],
                                },
                            },
                        },
                        {
                            $sort: {
                                applied: 1,
                                rank: -1,
                                "data.job.salary": -1,
                            },
                        },
                    ]);
                })
                .then(async (data) => {
                    return await getResultFromCursor(data);
                })
                .then((jobs) => {
                    // console.log(JSON.stringify(jobs,null,2));
                    res.render("student/dashboard-tabs/view-drives", {
                        jobs,
                        skills: userData.result.data.education.skills,
                    });
                })
                .catch((err) => {
                    console.log(err.message);
                    res.render("student/dashboard-tabs/view-drives", {
                        jobs: [],
                        skills: [],
                    });
                });
        }
    });
});

//Apply for Specific Drive
studentTabs.post("/drive/:drive/apply", async (req, res) => {
    var drive = req.params.drive;
    const user = await new User(req);
    await user.initialize().then(async (data) => {
        if (data.isLoggedIn && user.hasAccessOf("student")) {
            var userData = await user.getUserData(data.user, {
                _id: 0,
                email: 1,
                "data.name": 1,
            });
            await MongoClient.connect(DB_CONNECTION_URL, {
                useUnifiedTopology: true,
            })
                .then(async (mongo) => {
                    var db = await mongo.db(config.DB_SERVER.DB_DATABASE);
                    return await db.collection("user_data").updateOne(
                        {
                            email: drive,
                        },
                        {
                            $push: {
                                "data.job.applied": userData.result.email,
                                messages: {
                                    from: data.user,
                                    name: userData.result.data.name,
                                    message: `${userData.result.data.name} had applied for your Job Post`,
                                    type: "help",
                                    date: new Date(),
                                },
                            },
                        }
                    );
                })
                .then((r) => {
                    if (r.result.n > 0) {
                        res.json({
                            success: true,
                        });
                    } else {
                        res.json({
                            success: false,
                            message: "DB Error",
                        });
                    }
                })
                .catch((err) => {
                    console.log(err.message);
                    res.json({
                        success: false,
                        message: err.message,
                    });
                });
        }
    });
});

studentTabs.post("/training-resources", async (req, res) => {
    const dir = path.join(__dirname, "../data/resource"); //////
    var isLoggedIn, type;
    const user = await new User(req);
    await user
        .initialize()
        .then((data) => {
            isLoggedIn = data.isLoggedIn;
            type = data.type;
        })
        .catch((error) => {
            console.log(error.message);
            isLoggedIn = false;
            type = "guest";
        })
        .finally(() => {
            fs.readdir(dir, (err, files) => {
                if (err) {
                    files = [];
                }
                res.render("student/dashboard-tabs/resources", {
                    files,
                    type,
                });
            });
        });
});


//placement prediction
studentTabs.post("/prediction", async (req, res) => {
    const NeuralNetwork = require("../neural_network/trained-model.js");
    const { calculateSensitivity, identifyHighestSensitivityInputs, recommendImprovements } = require("../neural_network/reccomend.js");
    const user = await new User(req);
    await user
        .initialize()
        .then(async (data) => {
            var userData = await user.getUserData(data.user, {
                _id: 0,
                "data.admission.engineering": 1,
                "data.admission.arrears": 1,
                "data.education.sslc.mark": 1,
                "data.education.plustwo.mark": 1,
                "data.education.course": 1,
                "data.education.experience": 1,
                "data.education.achievement": 1,
            });
            
            var input = purifyDataSet(userData.result);
            var output = NeuralNetwork(input);
            const sensitivity = calculateSensitivity(input, output);
            const highestSensitivityInputs = identifyHighestSensitivityInputs(sensitivity);
            const recommendations = recommendImprovements(highestSensitivityInputs);
            var percent = parseInt(output * 10000) / 100;
            var placement = percent < 50 ? false : true;
          
            res.render("student/dashboard-tabs/prediction", {
                placement,
                percent,
                recommendations
            });
        })
        .catch((error) => {
            console.log(error.message);
            res.status(500);
            res.end("");
        });
});



module.exports = studentTabs;
