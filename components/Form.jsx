import RegularButton from './RegularButton'
import Select from './Select'

export default function Form({ handleSubmit, handleChange }) {
    return (
        <div className="form-container">
            <p className="p--regular">
                Anpassa spelet genom att välja kategori och antal minneskort.
            </p>
            <form className="wrapper">
                <div className="form__inner-wrapper">
                    <label htmlFor="category">Välj kategori</label>
                    <select
                        name="category"
                        id="category"
                        onChange={handleChange}
                    >
                        <option value="animals-and-nature">Djur och natur</option>
                        <option value="food-and-drink">Mat och dryck</option>
                        <option value="travel-and-places">Resor och platser</option>
                        <option value="objects">Objekt</option>
                        <option value="symbols">Symboler</option>
                        <option value="pokemon">Pokemon</option>
                        <option value="dogs">Hundar</option>
                        <option value="rickandmorty">Rick & Morty</option>
                    </select>
                </div>
                <div className="form__inner-wrapper">
                    <label htmlFor="number">Välj antal kort</label>
                    <select
                        name="number"
                        id="number"
                        onChange={handleChange}
                    >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                        <option value="40">40</option>
                        <option value="50">50</option>
                    </select>
                </div>
                <RegularButton handleClick={handleSubmit}>
                    Starta spel
                </RegularButton>
            </form>
        </div>
    )
}