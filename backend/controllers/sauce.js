// Récupération du modèle 'sauce' //
const Sauce = require('../models/Sauce');
// Récupération du module 'file system' de Node permettant de gérer ici les téléchargements et modifications d'images //
const fs = require('fs');

// Permet de créer une nouvelle sauce //

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Objet enregistré !' }))
        .catch(error => res.status(400).json({ error }));
};

// Permet de modifier une sauce //

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Objet modifié !'}))
        .catch(error => res.status(400).json({ error }));
};

// Permet de supprimer la sauce //

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(thing => {
            const filename = thing.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
                    .catch(error => res.status(400).json({ error }));
            });
        })
        .catch(error => res.status(500).json({ error }));
};

// Permet de récupérer une seule sauce, identifiée par son id depuis la base MongoDB //

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

// Permet de récuperer toutes les sauces de la base MongoDB //

exports.getAllSauce = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

// Permet de "like" ou "dislike" une sauce //
exports.likeDislikeSauce = (req, res, next) => {
    // Pour la route READ = Ajout/suppression d'un like / dislike à une sauce
    // Like présent dans le body
    let like = req.body.like
    // On prend le userID
    let userId = req.body.userId
    // On prend l'id de la sauce
    let sauceId = req.params.id

    if (like === 1) { // Si il s'agit d'un like //
        Sauce.updateOne({
            _id: sauceId
        }, {
            $push: {  // On push l'utilisateur et on incrémente le compteur de 1 //
                usersLiked: userId
            },
            $inc: {
                likes: +1
            }, // On incrémente de 1
        })
            .then(() => res.status(200).json({
                message: 'j\'aime ajouté !'
            }))
            .catch((error) => res.status(400).json({
                error
            }))
    }
    if (like === -1) { // S'il s'agit d'un dislike //
        Sauce.updateOne(
            {
                _id: sauceId
            }, {
                $push: {  // On push l'utilisateur et on incrémente le compteur de 1 //
                    usersDisliked: userId
                },
                $inc: {
                    dislikes: +1
                }, // On incrémente de 1
            }
        )
            .then(() => {
                res.status(200).json({
                    message: 'Dislike ajouté !'
                })
            })
            .catch((error) => res.status(400).json({
                error
            }))
    }
    if (like === 0) { // Si il s'agit d'annuler un like ou un dislike //
        Sauce.findOne({
            _id: sauceId
        })
            .then((sauce) => {
                if (sauce.usersLiked.includes(userId)) { // On recherche si l'utilisitateur est dans le tableau //
                    Sauce.updateOne({
                        _id: sauceId
                    }, {
                        $pull: {
                            usersLiked: userId
                        },
                        $inc: {
                            likes: -1
                        }, // On incrémente de -1
                    })
                        .then(() => res.status(200).json({
                            message: 'Like retiré !'
                        }))
                        .catch((error) => res.status(400).json({
                            error
                        }))
                }
                if (sauce.usersDisliked.includes(userId)) { // On recherche si l'utilisitateur est dans le tableau //
                    Sauce.updateOne({
                        _id: sauceId
                    }, {
                        $pull: {
                            usersDisliked: userId
                        },
                        $inc: {
                            dislikes: -1
                        }, // On incrémente de -1
                    })
                        .then(() => res.status(200).json({
                            message: 'Dislike retiré !'
                        }))
                        .catch((error) => res.status(400).json({
                            error
                        }))
                }
            })
            .catch((error) => res.status(404).json({
                error
            }))
    }
}
