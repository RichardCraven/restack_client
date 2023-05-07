export function CrewManager(){
    // this.tiles = [];
    this.memberTypes = [
        'monk',
        'barbarian',
        'wizard',
        'sorceress',
        'rogue',
        'archer',
        'sage',
        'soldier'
    ]
    this.crew = [];


    
    this.initializeCrew = (crew) => {
        console.log('initializing crew:', crew)
        this.crew = [];
        crew.forEach(member=> { 
            if(this.memberTypes.includes(member.image)){
                this.crew.push(member)
            }
        })
    }
    this.addCrewMember = (member) => {
        this.crew.push(member)
    }
}